const Question = require('../models/Question');

// 安全处理函数，防止 XSS 攻击
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  return input;
};

// 添加新题目
exports.addQuestion = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // 安全处理输入
  const { title, content, options, correctAnswer, difficulty, category, points } = req.body;
  const sanitizedData = {
    title: sanitizeInput(title),
    content: sanitizeInput(content),
    options: Array.isArray(options) ? options.map(opt => sanitizeInput(opt)) : [],
    correctAnswer: parseInt(correctAnswer),
    difficulty: sanitizeInput(difficulty),
    category: sanitizeInput(category),
    points: parseInt(points)
  };

  try {
    const question = await Question.create(sanitizedData);
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取题目列表
exports.getQuestions = async (req, res) => {
  const { difficulty, category, limit } = req.query;

  try {
    let query = {};

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (category) {
      query.category = category;
    }

    // 限制返回的字段，避免敏感信息泄露
    // 对于管理员，默认返回所有题目；对于普通用户，限制为10个
    const defaultLimit = req.user && req.user.role === 'admin' ? 100 : 10;
    const questions = await Question.find(query, { __v: 0 })
      .limit(limit ? Math.min(parseInt(limit), 100) : defaultLimit); // 限制最大返回数量

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 获取单个题目
exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id, { __v: 0 });

    if (question) {
      res.json(question);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 更新题目
exports.updateQuestion = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  // 安全处理输入
  const sanitizedData = {};
  if (req.body.title) sanitizedData.title = sanitizeInput(req.body.title);
  if (req.body.content) sanitizedData.content = sanitizeInput(req.body.content);
  if (Array.isArray(req.body.options)) sanitizedData.options = req.body.options.map(opt => sanitizeInput(opt));
  if (req.body.correctAnswer !== undefined) sanitizedData.correctAnswer = parseInt(req.body.correctAnswer);
  if (req.body.difficulty) sanitizedData.difficulty = sanitizeInput(req.body.difficulty);
  if (req.body.category) sanitizedData.category = sanitizeInput(req.body.category);
  if (req.body.points !== undefined) sanitizedData.points = parseInt(req.body.points);

  try {
    const question = await Question.findById(req.params.id);

    if (question) {
      const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, sanitizedData, { new: true, select: '-__v' });
      res.json(updatedQuestion);
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 删除题目
exports.deleteQuestion = async (req, res) => {
  // 检查是否是管理员
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const question = await Question.findById(req.params.id);

    if (question) {
      await question.remove();
      res.json({ message: 'Question removed' });
    } else {
      res.status(404).json({ message: 'Question not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};