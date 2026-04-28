const path = require('path');
const dotenv = require('dotenv');
const passwordChallengeQuestions = require('../data/passwordChallengeQuestions.json');
const passwordChallengeExplanations = require('../data/passwordChallengeExplanations.json');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize, Question } = require('../src/models');
const { ensureDatabase } = require('../src/config/ensureDatabase');
const { ensureSchemaCompatibility } = require('../src/config/ensureSchemaCompatibility');

const passwordChallengeQuestionBank = passwordChallengeQuestions.map((question) => ({
  ...question,
  explanation: question.explanation || passwordChallengeExplanations[question.title] || null,
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
