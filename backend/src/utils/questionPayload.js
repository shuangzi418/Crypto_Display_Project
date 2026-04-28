const { sanitizeInput } = require('./sanitize');

const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const normalizeOptions = (options) => {
  if (Array.isArray(options)) {
    return options.map((option) => sanitizeInput(String(option))).filter(Boolean);
  }

  if (typeof options === 'string') {
    return options
      .split('\n')
      .map((option) => sanitizeInput(option))
      .filter(Boolean);
  }

  return [];
};

const normalizeQuestionPayload = (payload) => {
  const title = sanitizeInput(payload.title);
  const content = sanitizeInput(payload.content);
  const explanation = sanitizeInput(payload.explanation) || null;
  const options = normalizeOptions(payload.options);
  const correctAnswer = Number(payload.correctAnswer);
  const difficulty = sanitizeInput(payload.difficulty);
  const category = sanitizeInput(payload.category);
  const points = Number(payload.points);

  if (!title) {
    throw new Error('题目标题不能为空');
  }

  if (!content) {
    throw new Error('题目内容不能为空');
  }

  if (options.length < 2) {
    throw new Error('至少需要两个选项');
  }

  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
    throw new Error('正确答案索引无效');
  }

  if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
    throw new Error('题目难度必须为 easy、medium 或 hard');
  }

  if (!category) {
    throw new Error('题目分类不能为空');
  }

  if (!Number.isInteger(points) || points <= 0) {
    throw new Error('题目分值必须为正整数');
  }

  return {
    title,
    content,
    explanation,
    options,
    correctAnswer,
    difficulty,
    category,
    points
  };
};

module.exports = {
  ALLOWED_DIFFICULTIES,
  normalizeQuestionPayload
};
