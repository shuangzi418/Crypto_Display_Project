const path = require('path');
const dotenv = require('dotenv');
const passwordChallengeQuestions = require('../data/passwordChallengeQuestions.json');
const passwordChallengeExplanations = require('../data/passwordChallengeExplanations.json');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

process.env.DB_DIALECT = process.env.DB_DIALECT || 'mysql';
process.env.DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || process.env.MYSQL_PORT || '3306';
process.env.DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'crypto_quiz';
process.env.DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';

const { sequelize, Question } = require('../src/models');
const { ensureDatabase } = require('../src/config/ensureDatabase');
const { ensureSchemaCompatibility } = require('../src/config/ensureSchemaCompatibility');

const passwordChallengeQuestionBank = passwordChallengeQuestions.map((question) => ({
  ...question,
  explanation: question.explanation || passwordChallengeExplanations[question.title] || null,
  correctExplanation: question.correctExplanation || question.explanation || passwordChallengeExplanations[question.title] || null,
  wrongExplanation: question.wrongExplanation || null,
  difficulty: question.difficulty || 'easy',
  category: question.category || '密码安全',
  points: question.points || 5
}));

async function upsertQuestion(payload) {
  const existingQuestion = await Question.findOne({
    where: {
      title: payload.title,
      category: payload.category
    }
  });

  if (existingQuestion) {
    await existingQuestion.update(payload);
    return existingQuestion;
  }

  return Question.create(payload);
}

async function seedNationalSecurityChallenge() {
  await ensureDatabase();
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureSchemaCompatibility();

  const createdQuestions = [];

  for (const payload of passwordChallengeQuestionBank) {
    const question = await upsertQuestion(payload);
    createdQuestions.push(question);
  }

  console.log(`Prepared ${createdQuestions.length} password challenge questions.`);
}

seedNationalSecurityChallenge()
  .then(async () => {
    await sequelize.close();
  })
  .catch(async (error) => {
    console.error(error);
    await sequelize.close().catch(() => {});
    process.exit(1);
  });
