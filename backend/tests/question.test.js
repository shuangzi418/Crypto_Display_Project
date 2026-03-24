require('dotenv').config();

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { User, Question } = require('../src/models');

describe('Question Management', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await app.ready;
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  beforeEach(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});

    const uniqueAdminEmail = `admin${Date.now()}@example.com`;
    await User.create({
      username: `admin${Date.now()}`,
      email: uniqueAdminEmail,
      password: 'password123',
      role: 'admin'
    });

    const uniqueUserEmail = `user${Date.now()}@example.com`;
    await User.create({
      username: `user${Date.now()}`,
      email: uniqueUserEmail,
      password: 'password123',
      role: 'user'
    });

    const adminLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueAdminEmail,
        password: 'password123'
      });

    const userLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueUserEmail,
        password: 'password123'
      });

    adminToken = adminLoginRes.body.token;
    userToken = userLoginRes.body.token;
  });

  test('should add a new question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Question',
        content: 'What is cryptography?',
        options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
        correctAnswer: 0,
        difficulty: 'easy',
        category: 'Basic',
        points: 10
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Question');
    expect(res.body.content).toBe('What is cryptography?');
  });

  test('should import questions in batch', async () => {
    const res = await request(app)
      .post('/api/questions/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        questions: [
          {
            title: 'Batch Question 1',
            content: 'Question content 1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 1,
            difficulty: 'easy',
            category: 'Batch',
            points: 5
          },
          {
            title: 'Batch Question 2',
            content: 'Question content 2',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 2,
            difficulty: 'medium',
            category: 'Batch',
            points: 8
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.importedCount).toBe(2);
    expect(res.body.failedCount).toBe(0);
  });

  test('should get questions list', async () => {
    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Question',
        content: 'What is cryptography?',
        options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
        correctAnswer: 0,
        difficulty: 'easy',
        category: 'Basic',
        points: 10
      });

    const res = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].correctAnswer).toBe(0);
  });

  test('should hide correct answers from regular users', async () => {
    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Question',
        content: 'What is cryptography?',
        options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
        correctAnswer: 0,
        difficulty: 'easy',
        category: 'Basic',
        points: 10
      });

    const res = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].correctAnswer).toBeUndefined();
  });

  test('should get a single question', async () => {
    const addRes = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Question',
        content: 'What is cryptography?',
        options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
        correctAnswer: 0,
        difficulty: 'easy',
        category: 'Basic',
        points: 10
      });

    const questionId = addRes.body._id;

    const res = await request(app)
      .get(`/api/questions/${questionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Test Question');
    expect(res.body.correctAnswer).toBeUndefined();
  });
});
