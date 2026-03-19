// 加载环境变量
require('dotenv').config();

// 添加TextEncoder polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const User = require('../src/models/User');
const Question = require('../src/models/Question');
const Submission = require('../src/models/Submission');
const mongoose = require('mongoose');

// 测试答题功能
describe('Submission Management', () => {
  let userToken;
  let questionId;

  // 在所有测试前清除数据库
  beforeAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});
  });

  // 在所有测试后清除数据库
  afterAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});
  });

  // 在测试前创建一个用户、一个题目
  beforeEach(async () => {
    // 清除数据库
    await User.deleteMany({});
    await Question.deleteMany({});
    await Submission.deleteMany({});

    // 创建用户
    const uniqueUserEmail = `test${Date.now()}@example.com`;
    const user = await User.create({
      username: `testuser${Date.now()}`,
      email: uniqueUserEmail,
      password: 'password123'
    });

    // 登录获取token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueUserEmail,
        password: 'password123'
      });

    userToken = loginRes.body.token;

    // 创建题目
    const question = await Question.create({
      title: 'Test Question',
      content: 'What is cryptography?',
      options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
      correctAnswer: 0,
      difficulty: 'easy',
      category: 'Basic',
      points: 10
    });

    questionId = question._id;
  });

  // 测试提交答案
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

  // 测试获取用户答题历史
  test('should get user submissions history', async () => {
    // 先提交一个答案
    await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        questionId,
        answer: 0
      });

    // 获取答题历史
    const res = await request(app)
      .get('/api/submissions/history')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });
});