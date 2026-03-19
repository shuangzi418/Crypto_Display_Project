const Submission = require('../models/Submission');
const Question = require('../models/Question');
const User = require('../models/User');
const Competition = require('../models/Competition');

// 提交答案
exports.submitAnswer = async (req, res) => {
  const { questionId, answer } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const userId = req.user.id;

  try {
    // 查找题目
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 检查答案是否正确
    const isCorrect = answer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    // 创建答题记录
    const submission = await Submission.create({
      user: userId,
      question: questionId,
      answer,
      isCorrect,
      points
    });

    // 更新用户分数
    if (isCorrect) {
      await User.findByIdAndUpdate(userId, {
        $inc: { score: points }
      });
    }

    res.json({
      submission,
      correctAnswer: question.correctAnswer,
      points
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取用户答题历史
exports.getUserSubmissions = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  try {
    const submissions = await Submission.find({ user: req.user.id })
      .populate('question')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 参加竞赛
exports.joinCompetition = async (req, res) => {
  const { competitionId } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const userId = req.user.id;

  try {
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // 检查用户是否已经参加
    const alreadyParticipated = competition.participants.some(
      participant => participant.user.toString() === userId
    );

    if (alreadyParticipated) {
      return res.status(400).json({ message: 'You have already joined this competition' });
    }

    // 添加用户到参与者列表
    competition.participants.push({
      user: userId,
      score: 0,
      completed: false
    });

    await competition.save();

    res.json({ message: 'Successfully joined the competition' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 提交竞赛答案
exports.submitCompetitionAnswer = async (req, res) => {
  const { competitionId, questionId, answer } = req.body;
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const userId = req.user.id;

  try {
    // 查找竞赛
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // 检查竞赛是否活跃
    if (competition.status !== 'active') {
      return res.status(400).json({ message: 'Competition is not active' });
    }

    // 查找题目
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // 检查题目是否在竞赛中
    if (!competition.questions.includes(questionId)) {
      return res.status(400).json({ message: 'Question not in competition' });
    }

    // 检查用户是否参加了竞赛
    const participantIndex = competition.participants.findIndex(
      participant => participant.user.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(400).json({ message: 'You are not a participant of this competition' });
    }

    // 检查答案是否正确
    const isCorrect = answer === question.correctAnswer;
    const points = isCorrect ? question.points : 0;

    // 创建答题记录
    const submission = await Submission.create({
      user: userId,
      question: questionId,
      answer,
      isCorrect,
      points
    });

    // 更新竞赛中的用户分数
    if (isCorrect) {
      competition.participants[participantIndex].score += points;
      await competition.save();

      // 更新用户总分数
      await User.findByIdAndUpdate(userId, {
        $inc: { score: points }
      });
    }

    res.json({
      submission,
      correctAnswer: question.correctAnswer,
      points,
      competitionScore: competition.participants[participantIndex].score
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取竞赛排行榜
exports.getCompetitionRanking = async (req, res) => {
  const { competitionId } = req.params;

  try {
    const competition = await Competition.findById(competitionId)
      .populate('participants.user', 'username nickname nicknameStatus avatar avatarStatus')
      .sort({ 'participants.score': -1 });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    // 排序参与者分数
    const ranking = competition.participants
      .sort((a, b) => b.score - a.score)
      .map((participant, index) => ({
        rank: index + 1,
        userId: participant.user._id,
        username: participant.user.username,
        nickname: participant.user.nickname,
        nicknameStatus: participant.user.nicknameStatus,
        avatar: participant.user.avatar,
        avatarStatus: participant.user.avatarStatus,
        score: participant.score
      }));

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};