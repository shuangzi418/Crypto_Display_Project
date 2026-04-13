const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Question } = require('../models');
const { H5ChallengeAttempt } = require('../h5/models');
const { serializeQuestions } = require('../utils/questionSerializer');

const CHALLENGE_SIZE = 20;
const CHALLENGE_TITLE = '密码安全知识挑战';
const CHALLENGE_DESCRIPTION = '页面将从系统题库中抽取 20 道密码安全知识题，支持逐题翻页作答，完成后自动颁发荣誉勋章。';
const CHALLENGE_FOOTER = '筑牢密码安全防线，你我皆是主角 | 学习密码知识，赢取荣誉勋章';
const CHALLENGE_TOKEN_TYPE = 'password-safety-challenge';
const PRIMARY_KEYWORDS = ['密码', '商用密码', '密码法', '验证码', '口令'];
const SECONDARY_KEYWORDS = ['认证', '签名', '保密', '安全', '破解'];
const MEDAL_RULES = [
  {
    tier: 'special',
    minCorrect: 20,
    badge: '特别荣誉',
    title: '密码安全之星',
    description: '20 题全部答对，解锁密码安全特别荣誉。'
  },
  {
    tier: 'gold',
    minCorrect: 19,
    badge: '金牌',
    title: '安全榜样·金徽',
    description: '答对 19 题，荣获金徽荣誉。'
  },
  {
    tier: 'silver',
    minCorrect: 17,
    badge: '银牌',
    title: '密码先锋·银徽',
    description: '答对 17 题，荣获银徽荣誉。'
  },
  {
    tier: 'bronze',
    minCorrect: 15,
    badge: '铜牌',
    title: '安全卫士·铜徽',
    description: '答对 15 题，荣获铜徽荣誉。'
  },
  {
    tier: 'encourage',
    minCorrect: 0,
    badge: '继续学习',
    title: '继续加油',
    description: '再学习一点密码安全知识，下一次就能冲击勋章。'
  }
];

const buildKeywordClauses = (keywords) => {
  return (keywords || []).flatMap((keyword) => ([
    { title: { [Op.like]: `%${keyword}%` } },
    { content: { [Op.like]: `%${keyword}%` } },
    { category: { [Op.like]: `%${keyword}%` } }
  ]));
};

const loadQuestionBatch = async ({ difficulty, keywords, excludeIds = [] }) => {
  const filters = [];

  if (difficulty) {
    filters.push({ difficulty });
  }

  if (excludeIds.length > 0) {
    filters.push({ id: { [Op.notIn]: excludeIds } });
  }

  const keywordClauses = buildKeywordClauses(keywords);

  if (keywordClauses.length > 0) {
    filters.push({ [Op.or]: keywordClauses });
  }

  const where = filters.length > 0 ? { [Op.and]: filters } : undefined;

  return Question.findAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: CHALLENGE_SIZE
  });
};

const appendUniqueQuestions = (selectedQuestions, questionBatch) => {
  const selectedIds = new Set(selectedQuestions.map((question) => String(question.id)));

  questionBatch.forEach((question) => {
    const questionId = String(question.id);

    if (!selectedIds.has(questionId) && selectedQuestions.length < CHALLENGE_SIZE) {
      selectedQuestions.push(question);
      selectedIds.add(questionId);
    }
  });
};

const loadChallengeQuestions = async () => {
  const selectedQuestions = [];

  appendUniqueQuestions(selectedQuestions, await loadQuestionBatch({
    difficulty: 'easy',
    keywords: PRIMARY_KEYWORDS
  }));

  if (selectedQuestions.length < CHALLENGE_SIZE) {
    appendUniqueQuestions(selectedQuestions, await loadQuestionBatch({
      difficulty: 'easy',
      keywords: SECONDARY_KEYWORDS,
      excludeIds: selectedQuestions.map((question) => question.id)
    }));
  }

  if (selectedQuestions.length < CHALLENGE_SIZE) {
    appendUniqueQuestions(selectedQuestions, await loadQuestionBatch({
      keywords: PRIMARY_KEYWORDS,
      excludeIds: selectedQuestions.map((question) => question.id)
    }));
  }

  if (selectedQuestions.length < CHALLENGE_SIZE) {
    appendUniqueQuestions(selectedQuestions, await loadQuestionBatch({
      difficulty: 'easy',
      excludeIds: selectedQuestions.map((question) => question.id)
    }));
  }

  return selectedQuestions.slice(0, CHALLENGE_SIZE);
};

const signChallengeToken = (questionIds) => {
  return jwt.sign({
    type: CHALLENGE_TOKEN_TYPE,
    questionIds
  }, process.env.JWT_SECRET || 'public-challenge-secret', {
    expiresIn: '4h'
  });
};

const verifyChallengeToken = (challengeToken) => {
  return jwt.verify(challengeToken, process.env.JWT_SECRET || 'public-challenge-secret');
};

const getMedalResult = (correctCount) => {
  return MEDAL_RULES.find((rule) => correctCount >= rule.minCorrect) || MEDAL_RULES[MEDAL_RULES.length - 1];
};

exports.getNationalSecurityChallenge = async (req, res) => {
  try {
    const questions = await loadChallengeQuestions();
    const ready = questions.length === CHALLENGE_SIZE;
    const questionIds = questions.map((question) => String(question.id));

    res.json({
      title: CHALLENGE_TITLE,
      description: CHALLENGE_DESCRIPTION,
      footer: CHALLENGE_FOOTER,
      totalQuestions: CHALLENGE_SIZE,
      ready,
      message: ready
        ? '挑战题目加载成功'
        : `当前题库中仅匹配到 ${questions.length} 道相关题目，请先在后台补充密码安全知识简单题。`,
      challengeToken: ready ? signChallengeToken(questionIds) : null,
      questions: serializeQuestions(questions),
      medalRules: MEDAL_RULES.map((rule) => ({
        tier: rule.tier,
        minCorrect: rule.minCorrect,
        badge: rule.badge,
        title: rule.title
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message || '加载挑战题目失败' });
  }
};

exports.submitNationalSecurityChallenge = async (req, res) => {
  const { challengeToken, answers } = req.body || {};

  if (!challengeToken) {
    return res.status(400).json({ message: '缺少挑战凭证，请刷新页面后重试' });
  }

  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return res.status(400).json({ message: '答案格式不正确' });
  }

  let payload;

  try {
    payload = verifyChallengeToken(challengeToken);
  } catch (error) {
    return res.status(400).json({ message: '挑战凭证已失效，请重新开始挑战' });
  }

  if (!payload || payload.type !== CHALLENGE_TOKEN_TYPE || !Array.isArray(payload.questionIds)) {
    return res.status(400).json({ message: '挑战凭证无效，请重新开始挑战' });
  }

  const questionIds = Array.from(new Set(payload.questionIds.map((questionId) => String(questionId)).filter(Boolean)));

  if (questionIds.length !== CHALLENGE_SIZE) {
    return res.status(400).json({ message: '挑战题目数量异常，请重新开始挑战' });
  }

  try {
    const questions = await Question.findAll({
      where: {
        id: questionIds
      }
    });

    if (questions.length !== CHALLENGE_SIZE) {
      return res.status(400).json({ message: '挑战题目已发生变化，请重新加载页面后作答' });
    }

    const questionMap = new Map(questions.map((question) => [String(question.id), question]));
    let correctCount = 0;
    let answeredCount = 0;

    questionIds.forEach((questionId) => {
      const rawAnswer = answers[questionId];

      if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') {
        return;
      }

      const normalizedAnswer = Number(rawAnswer);

      if (!Number.isInteger(normalizedAnswer)) {
        return;
      }

      answeredCount += 1;

      if (questionMap.get(questionId).correctAnswer === normalizedAnswer) {
        correctCount += 1;
      }
    });

    const totalQuestions = questionIds.length;
    const unansweredCount = totalQuestions - answeredCount;
    const wrongCount = totalQuestions - correctCount;
    const medal = getMedalResult(correctCount);

    if (req.h5User) {
      await H5ChallengeAttempt.create({
        userId: req.h5User.id,
        challengeKey: 'password-safety',
        correctCount,
        answeredCount,
        unansweredCount,
        totalQuestions,
        medalTier: medal.tier,
        medalTitle: medal.title
      });
    }

    res.json({
      title: CHALLENGE_TITLE,
      footer: CHALLENGE_FOOTER,
      correctCount,
      answeredCount,
      unansweredCount,
      wrongCount,
      totalQuestions,
      medal,
      submittedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message || '提交挑战失败' });
  }
};
