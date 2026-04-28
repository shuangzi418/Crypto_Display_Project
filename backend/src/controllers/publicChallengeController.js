const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Question } = require('../models');
const { H5ChallengeAttempt } = require('../h5/models');
const { serializeQuestions } = require('../utils/questionSerializer');
const questionExplanations = require('../../data/passwordChallengeExplanations.json');

const CHALLENGE_SIZE = 15;
const CHALLENGE_TITLE = '密码安全知识挑战';
const CHALLENGE_DESCRIPTION = '页面将从系统题库中抽取 15 道密码安全知识题，支持逐题翻页作答，完成后自动颁发荣誉勋章。';
const CHALLENGE_FOOTER = '筑牢密码安全防线，你我皆是主角 | 学习密码知识，赢取荣誉勋章';
const CHALLENGE_TOKEN_TYPE = 'password-safety-challenge';
const PRIMARY_KEYWORDS = ['密码', '商用密码', '密码法', '验证码', '口令'];
const SECONDARY_KEYWORDS = ['认证', '签名', '保密', '安全', '破解'];
const MEDAL_RULES = [
  {
    tier: 'gold',
    minCorrect: 12,
    badge: '金奖',
    title: '密码安全金奖',
    description: '答对 12 题及以上，荣获密码安全金奖。'
  },
  {
    tier: 'silver',
    minCorrect: 10,
    badge: '银奖',
    title: '密码安全银奖',
    description: '答对 10 题及以上，荣获密码安全银奖。'
  },
  {
    tier: 'encourage',
    minCorrect: 0,
    badge: '未获奖',
    title: '继续加油',
    description: '答对 10 题可获银奖，答对 12 题可获金奖。'
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

const getQuestionExplanation = (question) => {
  const normalizedTitle = String(question?.title || '').trim();

  return question?.explanation
    || questionExplanations[normalizedTitle]
    || '建议结合标准答案回顾本题所涉及的密码安全知识点，进一步理解正确做法和风险边界。';
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
      medalRules: MEDAL_RULES.filter((rule) => rule.minCorrect > 0).map((rule) => ({
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
    const review = [];

    questionIds.forEach((questionId) => {
      const question = questionMap.get(questionId);
      const rawAnswer = answers[questionId];
      let selectedAnswer = null;
      let isCorrect = false;

      if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') {
        review.push({
          questionId,
          title: question.title,
          content: question.content,
          options: question.options,
          selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: getQuestionExplanation(question)
        });
        return;
      }

      const normalizedAnswer = Number(rawAnswer);

      if (Number.isInteger(normalizedAnswer)) {
        selectedAnswer = normalizedAnswer;
        answeredCount += 1;
        isCorrect = question.correctAnswer === normalizedAnswer;

        if (isCorrect) {
          correctCount += 1;
        }
      }

      review.push({
        questionId,
        title: question.title,
        content: question.content,
        options: question.options,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: getQuestionExplanation(question)
      });
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
      review,
      medal,
      submittedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message || '提交挑战失败' });
  }
};
