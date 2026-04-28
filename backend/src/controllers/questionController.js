const { Question } = require('../models');
const { normalizeQuestionPayload } = require('../utils/questionPayload');
const { parseQuestionRows, parseQuestionContent, parseQuestionFile } = require('../utils/questionImport');
const { serializeQuestion, serializeQuestions } = require('../utils/questionSerializer');

const PREVIEW_LIMIT = 20;

const buildListFilters = (query) => {
  const filters = {};

  if (query.difficulty) {
    filters.difficulty = query.difficulty;
  }

  if (query.category) {
    filters.category = query.category;
  }

  return filters;
};

const ensureAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied' });
    return false;
  }

  return true;
};

const buildImportSummary = (parsed) => {
  const validPreview = parsed.rowResults
    .filter((result) => result.status === 'success')
    .slice(0, PREVIEW_LIMIT)
    .map((result) => ({
      row: result.row,
      ...result.normalizedQuestion
    }));

  const failedRows = parsed.rowResults
    .filter((result) => result.status === 'error')
    .map((result) => ({
      row: result.row,
      message: result.message,
      sourceRow: result.sourceRow
    }));

  return {
    totalRows: parsed.totalRows,
    validCount: parsed.validQuestions.length,
    failedCount: parsed.errors.length,
    errors: parsed.errors,
    failedRows,
    validPreview,
    previewLimit: PREVIEW_LIMIT,
    detectedFormat: parsed.detectedFormat,
    detectedFormatLabel: parsed.detectedFormatLabel,
    recognitionMode: parsed.recognitionMode
  };
};

const parseImportRequest = (req) => {
  const batch = req.body && req.body.questions;
  const content = req.body && req.body.content;

  if (Array.isArray(batch) && batch.length > 0) {
    return parseQuestionRows(batch);
  }

  if (typeof content === 'string' && content.trim()) {
    return parseQuestionContent(content);
  }

  throw new Error('请提供非空题目数组或可自动识别的导入内容');
};

exports.addQuestion = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const payload = normalizeQuestionPayload(req.body);
    const question = await Question.create(payload);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.importQuestions = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  let parsed;

  try {
    parsed = parseImportRequest(req);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const summary = buildImportSummary(parsed);
  const { validQuestions } = parsed;

  if (validQuestions.length === 0) {
    return res.status(400).json({
      message: '没有可导入的有效题目',
      importedCount: 0,
      ...summary
    });
  }

  try {
    const createdQuestions = await Question.bulkCreate(validQuestions);
    res.status(201).json({
      importedCount: createdQuestions.length,
      questions: createdQuestions,
      ...summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.previewImportQuestions = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const parsed = parseImportRequest(req);
    const summary = buildImportSummary(parsed);

    res.json({
      message: '导入内容识别成功',
      ...summary
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.importQuestionsFromFile = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  let parsed;

  try {
    parsed = parseQuestionFile(req.file);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const summary = buildImportSummary(parsed);
  const { validQuestions } = parsed;

  if (validQuestions.length === 0) {
    return res.status(400).json({
      message: '文件中没有可导入的有效题目',
      importedCount: 0,
      ...summary
    });
  }

  try {
    const createdQuestions = await Question.bulkCreate(validQuestions);
    res.status(201).json({
      importedCount: createdQuestions.length,
      questions: createdQuestions,
      source: req.file.originalname,
      ...summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.previewImportQuestionsFromFile = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const parsed = parseQuestionFile(req.file);
    const summary = buildImportSummary(parsed);

    res.json({
      message: '导入文件识别成功',
      source: req.file.originalname,
      ...summary
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  const filters = buildListFilters(req.query);
  const includeAdminFields = req.user && req.user.role === 'admin';
  const defaultLimit = includeAdminFields ? 100 : 10;
  const parsedLimit = Number(req.query.limit);
  const limit = Number.isInteger(parsedLimit)
    ? Math.max(1, Math.min(parsedLimit, 100))
    : defaultLimit;

  try {
    const questions = await Question.findAll({
      where: filters,
      limit,
      order: [['createdAt', 'DESC']]
    });

    res.json(serializeQuestions(questions, {
      includeCorrectAnswer: includeAdminFields,
      includeExplanation: includeAdminFields
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(serializeQuestion(question, {
      includeCorrectAnswer: req.user && req.user.role === 'admin',
      includeExplanation: req.user && req.user.role === 'admin'
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const payload = normalizeQuestionPayload({
      title: req.body.title !== undefined ? req.body.title : question.title,
      content: req.body.content !== undefined ? req.body.content : question.content,
      explanation: req.body.explanation !== undefined ? req.body.explanation : question.explanation,
      options: req.body.options !== undefined ? req.body.options : question.options,
      correctAnswer: req.body.correctAnswer !== undefined ? req.body.correctAnswer : question.correctAnswer,
      difficulty: req.body.difficulty !== undefined ? req.body.difficulty : question.difficulty,
      category: req.body.category !== undefined ? req.body.category : question.category,
      points: req.body.points !== undefined ? req.body.points : question.points
    });

    await question.update(payload);
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  if (!ensureAdmin(req, res)) {
    return;
  }

  try {
    const question = await Question.findByPk(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await question.destroy();
    res.json({ message: 'Question removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
