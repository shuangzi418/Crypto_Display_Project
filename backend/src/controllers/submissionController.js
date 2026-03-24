const { sequelize, Submission, Question, User, Competition, CompetitionParticipant } = require('../models');
const { serializeSubmission } = require('../utils/questionSerializer');

const PRACTICE_COMPETITION_ID = 0;

const buildSubmissionResponse = (submission, question, extra = {}) => ({
  submission: serializeSubmission(submission),
  correctAnswer: question.correctAnswer,
  points: extra.points || 0,
  alreadySubmitted: Boolean(extra.alreadySubmitted),
  ...(extra.additional || {})
});

const findExistingSubmission = ({ userId, questionId, competitionId }) => {
  return Submission.findOne({
    where: {
      userId,
      questionId,
      competitionId
    }
  });
};

exports.submitAnswer = async (req, res) => {
  const { questionId, answer } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const question = await Question.findByPk(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const normalizedAnswer = Number(answer);
    const isCorrect = normalizedAnswer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    const existingSubmission = await findExistingSubmission({
      userId: req.user.id,
      questionId: question.id,
      competitionId: PRACTICE_COMPETITION_ID
    });

    if (existingSubmission) {
      return res.json(buildSubmissionResponse(existingSubmission, question, {
        alreadySubmitted: true,
        points: 0
      }));
    }

    const submission = await sequelize.transaction(async (transaction) => {
      const createdSubmission = await Submission.create({
        userId: req.user.id,
        questionId: question.id,
        competitionId: PRACTICE_COMPETITION_ID,
        answer: normalizedAnswer,
        isCorrect,
        points
      }, { transaction });

      if (isCorrect) {
        await User.increment('score', {
          by: points,
          where: { id: req.user.id },
          transaction
        });
      }

      return createdSubmission;
    });

    res.json(buildSubmissionResponse(submission, question, { points }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserSubmissions = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const submissions = await Submission.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Question,
          as: 'question'
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json(submissions.map((submission) => serializeSubmission(submission)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinCompetition = async (req, res) => {
  const { competitionId } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const competition = await Competition.findByPk(competitionId);

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const existingParticipant = await CompetitionParticipant.findOne({
      where: {
        competitionId: competition.id,
        userId: req.user.id
      }
    });

    if (existingParticipant) {
      return res.json({
        message: 'Already joined this competition',
        alreadyJoined: true
      });
    }

    await CompetitionParticipant.create({
      competitionId: competition.id,
      userId: req.user.id,
      score: 0,
      completed: false
    });

    res.json({ message: 'Successfully joined the competition', alreadyJoined: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitCompetitionAnswer = async (req, res) => {
  const { competitionId, questionId, answer } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const competition = await Competition.findByPk(competitionId, {
      include: [
        {
          model: Question,
          as: 'questions',
          through: { attributes: [] }
        }
      ]
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    if (competition.status !== 'active') {
      return res.status(400).json({ message: 'Competition is not active' });
    }

    const question = competition.questions.find((item) => String(item.id) === String(questionId));

    if (!question) {
      return res.status(400).json({ message: 'Question not in competition' });
    }

    const participant = await CompetitionParticipant.findOne({
      where: {
        competitionId: competition.id,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(400).json({ message: 'You are not a participant of this competition' });
    }

    const normalizedAnswer = Number(answer);
    const isCorrect = normalizedAnswer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    const existingSubmission = await findExistingSubmission({
      userId: req.user.id,
      questionId: question.id,
      competitionId: competition.id
    });

    if (existingSubmission) {
      return res.json(buildSubmissionResponse(existingSubmission, question, {
        alreadySubmitted: true,
        points: 0,
        additional: {
          competitionScore: participant.score
        }
      }));
    }

    const result = await sequelize.transaction(async (transaction) => {
      const submission = await Submission.create({
        userId: req.user.id,
        questionId: question.id,
        competitionId: competition.id,
        answer: normalizedAnswer,
        isCorrect,
        points
      }, { transaction });

      let competitionScore = participant.score;

      if (isCorrect) {
        participant.score += points;
        await participant.save({ transaction });
        competitionScore = participant.score;

        await User.increment('score', {
          by: points,
          where: { id: req.user.id },
          transaction
        });
      }

      return {
        submission,
        competitionScore
      };
    });

    res.json(buildSubmissionResponse(result.submission, question, {
      points,
      additional: {
        competitionScore: result.competitionScore
      }
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompetitionRanking = async (req, res) => {
  const { competitionId } = req.params;

  try {
    const competition = await Competition.findByPk(competitionId, {
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'nickname', 'nicknameStatus', 'avatar', 'avatarStatus'],
          through: {
            attributes: ['score', 'completed']
          }
        }
      ]
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const ranking = competition.participants
      .slice()
      .sort((left, right) => right.CompetitionParticipant.score - left.CompetitionParticipant.score)
      .map((participant, index) => ({
        rank: index + 1,
        userId: String(participant.id),
        username: participant.username,
        nickname: participant.nickname,
        nicknameStatus: participant.nicknameStatus,
        avatar: participant.avatar,
        avatarStatus: participant.avatarStatus,
        score: participant.CompetitionParticipant.score
      }));

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
