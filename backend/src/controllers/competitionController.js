const { Op } = require('sequelize');
const {
  Competition,
  CompetitionParticipant,
  Question,
  User
} = require('../models');
const { sanitizeInput } = require('../utils/sanitize');
const { serializeQuestions } = require('../utils/questionSerializer');

const competitionInclude = [
  {
    model: Question,
    as: 'questions',
    through: { attributes: [] }
  }
];

const competitionDetailInclude = [
  ...competitionInclude,
  {
    model: User,
    as: 'participants',
    attributes: ['id', 'username', 'nickname', 'nicknameStatus', 'avatar', 'avatarStatus'],
    through: {
      attributes: ['score', 'completed']
    }
  }
];

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied' });
    return false;
  }

  return true;
};

const mapCompetition = (competition) => {
  const plainCompetition = competition.toJSON();

  if (Array.isArray(plainCompetition.questions)) {
    plainCompetition.questions = serializeQuestions(plainCompetition.questions);
  }

  if (Array.isArray(plainCompetition.participants)) {
    plainCompetition.participants = plainCompetition.participants.map((participant) => ({
      user: {
        _id: participant._id,
        id: participant.id,
        username: participant.username,
        nickname: participant.nickname,
        nicknameStatus: participant.nicknameStatus,
        avatar: participant.avatar,
        avatarStatus: participant.avatarStatus
      },
      score: participant.CompetitionParticipant ? participant.CompetitionParticipant.score : 0,
      completed: participant.CompetitionParticipant ? participant.CompetitionParticipant.completed : false
    }));
  }

  return plainCompetition;
};

const loadQuestions = async (questionIds) => {
  const uniqueIds = Array.from(new Set((questionIds || []).map((id) => String(id).trim()).filter(Boolean)));

  if (uniqueIds.length === 0) {
    throw new Error('请至少选择一道题目');
  }

  const questions = await Question.findAll({
    where: {
      id: uniqueIds
    }
  });

  if (questions.length !== uniqueIds.length) {
    throw new Error('包含不存在的题目');
  }

  return uniqueIds.map((id) => questions.find((question) => String(question.id) === String(id)));
};

const normalizeCompetitionPayload = async (payload, allowStatusOverride = true) => {
  const title = sanitizeInput(payload.title);
  const description = sanitizeInput(payload.description);
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  const status = payload.status || 'upcoming';

  if (!title) {
    throw new Error('竞赛标题不能为空');
  }

  if (!description) {
    throw new Error('竞赛描述不能为空');
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('竞赛时间范围无效');
  }

  if (endDate <= startDate) {
    throw new Error('竞赛结束时间必须晚于开始时间');
  }

  if (!['upcoming', 'active', 'ended'].includes(status)) {
    throw new Error('竞赛状态无效');
  }

  const questions = await loadQuestions(payload.questions);
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);

  return {
    values: {
      title,
      description,
      startDate,
      endDate,
      status: allowStatusOverride ? status : 'upcoming',
      totalPoints
    },
    questions
  };
};

exports.addCompetition = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const normalized = await normalizeCompetitionPayload(req.body);
    const competition = await Competition.create(normalized.values);
    await competition.setQuestions(normalized.questions.map((question) => question.id));

    const createdCompetition = await Competition.findByPk(competition.id, {
      include: competitionInclude
    });

    res.status(201).json(createdCompetition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCompetitions = async (req, res) => {
  const where = {};

  if (req.query.status) {
    where.status = req.query.status;
  }

  if (req.query.search) {
    const keyword = `%${req.query.search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: keyword } },
      { description: { [Op.like]: keyword } }
    ];
  }

  try {
    const competitions = await Competition.findAll({
      where,
      include: competitionInclude,
      order: [['startDate', 'DESC']]
    });

    res.json(competitions.map((competition) => mapCompetition(competition)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findByPk(req.params.id, {
      include: competitionDetailInclude
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json(mapCompetition(competition));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCompetition = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const competition = await Competition.findByPk(req.params.id, {
      include: competitionInclude
    });

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    const normalized = await normalizeCompetitionPayload({
      title: req.body.title !== undefined ? req.body.title : competition.title,
      description: req.body.description !== undefined ? req.body.description : competition.description,
      startDate: req.body.startDate !== undefined ? req.body.startDate : competition.startDate,
      endDate: req.body.endDate !== undefined ? req.body.endDate : competition.endDate,
      questions: req.body.questions !== undefined
        ? req.body.questions
        : competition.questions.map((question) => question.id),
      status: req.body.status !== undefined ? req.body.status : competition.status
    });

    await competition.update(normalized.values);
    await competition.setQuestions(normalized.questions.map((question) => question.id));

    const updatedCompetition = await Competition.findByPk(competition.id, {
      include: competitionInclude
    });

    res.json(updatedCompetition);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCompetition = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const competition = await Competition.findByPk(req.params.id);

    if (!competition) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    await CompetitionParticipant.destroy({ where: { competitionId: competition.id } });
    await competition.setQuestions([]);
    await competition.destroy();

    res.json({ message: 'Competition removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCompetitionStatus = async (req, res) => {
  try {
    const competitions = await Competition.findAll();
    const now = new Date();

    await Promise.all(competitions.map(async (competition) => {
      let nextStatus = competition.status;

      if (competition.startDate <= now && competition.endDate >= now) {
        nextStatus = 'active';
      } else if (competition.endDate < now) {
        nextStatus = 'ended';
      } else if (competition.startDate > now) {
        nextStatus = 'upcoming';
      }

      if (nextStatus !== competition.status) {
        competition.status = nextStatus;
        await competition.save();
      }
    }));

    res.json({ message: 'Competition statuses updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
