if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { Question } = require('../src/models');
const { H5User, H5ChallengeAttempt } = require('../src/h5/models');

describe('H5 Password Safety Challenge', () => {
  beforeAll(async () => {
    await app.ready;
    await Question.deleteMany({});
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});
  });

  afterAll(async () => {
    await Question.deleteMany({});
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});
  });

  beforeEach(async () => {
    await Question.deleteMany({});
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});

    const questionPayloads = Array.from({ length: 20 }, (_, index) => ({
      title: `密码安全测试题 ${index + 1}`,
      content: `密码安全基础知识单选题 ${index + 1} 的正确说法是什么？`,
      options: ['正确选项', '错误选项一', '错误选项二', '错误选项三'],
      correctAnswer: 0,
      difficulty: 'easy',
      category: '密码安全',
      points: 5
    }));

    for (const payload of questionPayloads) {
      await Question.create(payload);
    }
  });

  test('should require h5 login before loading challenge', async () => {
    const res = await request(app)
      .get('/api/challenges/national-security');

    expect(res.statusCode).toBe(401);
  });

  test('should provide a ready challenge after h5 registration and record attempts', async () => {
    const agent = request.agent(app);

    const registerRes = await agent
      .post('/api/h5-auth/register')
      .send({
        phone: '13800000001',
        username: 'challenge-user'
      });

    expect(registerRes.statusCode).toBe(201);

    const loadRes = await agent
      .get('/api/challenges/national-security');

    expect(loadRes.statusCode).toBe(200);
    expect(loadRes.body.ready).toBe(true);
    expect(loadRes.body.questions).toHaveLength(20);
    expect(loadRes.body.questions[0].correctAnswer).toBeUndefined();

    const answers = {};

    loadRes.body.questions.forEach((question, index) => {
      answers[question._id] = index < 17 ? 0 : 1;
    });

    const submitRes = await agent
      .post('/api/challenges/national-security/submit')
      .send({
        challengeToken: loadRes.body.challengeToken,
        answers
      });

    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.correctCount).toBe(17);
    expect(submitRes.body.medal.tier).toBe('silver');

    const attempts = await H5ChallengeAttempt.findAll();
    expect(attempts).toHaveLength(1);
    expect(attempts[0].medalTier).toBe('silver');
  });
});
