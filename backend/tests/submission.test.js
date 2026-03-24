require('dotenv').config();

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { User, Question, Submission } = require('../src/models');

describe('Submission Management', () => {
  let userToken;
  let userId;
  let questionId;

  beforeAll(async () => {
    await app.ready;
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});

    const uniqueUserEmail = `test${Date.now()}@example.com`;
    const user = await User.create({
      username: `testuser${Date.now()}`,
      email: uniqueUserEmail,
      password: 'password123'
    });
    userId = user.id;

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueUserEmail,
        password: 'password123'
      });

    userToken = loginRes.body.token;

    const question = await Question.create({
      title: 'Test Question',
      content: 'What is cryptography?',
      options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
      correctAnswer: 0,
      difficulty: 'easy',
      category: 'Basic',
      points: 10
    });

    questionId = String(question.id);
  });

  test('should submit an answer', async () => {
    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId,
        answer: 0
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.submission.isCorrect).toBe(true);
    expect(res.body.points).toBe(10);
  });

  test('should get user submissions history', async () => {
    await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId,
        answer: 0
      });

    const res = await request(app)
      .get('/api/submissions/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].question.correctAnswer).toBeUndefined();
  });

  test('should not award points twice for the same practice question', async () => {
    const firstRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId,
        answer: 0
      });

    const secondRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId,
        answer: 0
      });

    const refreshedUser = await User.findByPk(userId);

    expect(firstRes.statusCode).toBe(200);
    expect(firstRes.body.points).toBe(10);
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.alreadySubmitted).toBe(true);
    expect(secondRes.body.points).toBe(0);
    expect(refreshedUser.score).toBe(10);
  });
});
