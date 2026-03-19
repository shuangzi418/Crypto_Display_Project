const Competition = require('../models/Competition');

// 安全处理函数，防止 XSS 攻击
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  return input;
};

// 添加新竞赛
exports.addCompetition = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // 安全处理输入
  const { title, description, startDate, endDate, questions } = req.body;
  const sanitizedData = {
    title: sanitizeInput(title),
    description: sanitizeInput(description),
    startDate,
    endDate,
    questions,
    status: 'upcoming'
  };

  try {
    const competition = await Competition.create(sanitizedData);
    res.status(201).json(competition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取竞赛列表
exports.getCompetitions = async (req, res) => {
  const { status, search } = req.query;

  try {
    let query = {};

    if (status) {
      query.status = status;
    }
    
    // 如果有搜索参数，构建搜索条件
    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const competitions = await Competition.find(query)
      .populate('questions', '-__v')
      .sort({ startDate: -1 });

    res.json(competitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个竞赛
exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('questions', '-__v')
      .populate('participants.user', 'username');

    if (competition) {
      res.json(competition);
    } else {
      res.status(404).json({ message: 'Competition not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 更新竞赛
exports.updateCompetition = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // 安全处理输入
  const sanitizedData = {};
  if (req.body.title) sanitizedData.title = sanitizeInput(req.body.title);
  if (req.body.description) sanitizedData.description = sanitizeInput(req.body.description);
  if (req.body.startDate) sanitizedData.startDate = req.body.startDate;
  if (req.body.endDate) sanitizedData.endDate = req.body.endDate;
  if (Array.isArray(req.body.questions)) sanitizedData.questions = req.body.questions;
  if (req.body.status) sanitizedData.status = req.body.status;

  try {
    const competition = await Competition.findById(req.params.id);

    if (competition) {
      const updatedCompetition = await Competition.findByIdAndUpdate(req.params.id, sanitizedData, { new: true, select: '-__v' });
      res.json(updatedCompetition);
    } else {
      res.status(404).json({ message: 'Competition not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 删除竞赛
exports.deleteCompetition = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const competition = await Competition.findById(req.params.id);

    if (competition) {
      await competition.remove();
      res.json({ message: 'Competition removed' });
    } else {
      res.status(404).json({ message: 'Competition not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 更新竞赛状态
exports.updateCompetitionStatus = async (req, res) => {
  try {
    const competitions = await Competition.find();
    const now = new Date();

    for (const competition of competitions) {
      if (competition.startDate <= now && competition.endDate >= now) {
        competition.status = 'active';
        await competition.save();
      } else if (competition.endDate < now) {
        competition.status = 'ended';
        await competition.save();
      }
    }

    res.json({ message: 'Competition statuses updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};