// 加载环境变量
require('dotenv').config();

// 添加TextEncoder polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const Competition = require('../src/models/Competition');
const Question = require('../src/models/Question');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// 测试竞赛功能
describe('Competition Management', () => {
  let adminToken;
  let userToken;
  let questionId;
  let competitionId;

  // 在所有测试前清除数据库
  beforeAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});
  });

  // 在所有测试后清除数据库
  afterAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});
  });

  // 在测试前创建一个管理员用户、一个普通用户、一个题目和一个竞赛
  beforeEach(async () => {
    // 清除数据库
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});

    // 创建管理员用户
    const uniqueAdminEmail = `admin${Date.now()}@example.com`;
    const adminUser = await User.create({
      username: `admin${Date.now()}`,
      email: uniqueAdminEmail,
      password: 'password123',
      role: 'admin'
    });

    // 创建普通用户
    const uniqueUserEmail = `test${Date.now()}@example.com`;
    const user = await User.create({
      username: `testuser${Date.now()}`,
      email: uniqueUserEmail,
      password: 'password123'
    });

    // 登录获取token
    const adminLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueAdminEmail,
        password: 'password123'
      });

    adminToken = adminLoginRes.body.token;

    const userLoginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueUserEmail,
        password: 'password123'
      });

    userToken = userLoginRes.body.token;

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

    // 创建竞赛
    const competition = await Competition.create({
      title: 'Test Competition',
      description: 'A test competition',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      questions: [questionId],
      status: 'active'
    });

    competitionId = competition._id;
  });

  // 测试添加竞赛
  test('should add a new competition', async () => {
    const res = await request(app)
      .post('/api/competitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'New Competition',
        description: 'A new competition',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        questions: [questionId]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Competition');
  });

  // 测试获取竞赛列表
  test('should get competitions list', async () => {
    const res = await request(app)
      .get('/api/competitions');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // 测试参加竞赛
  test('should join a competition', async () => {
    const res = await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Successfully joined the competition');
  });

  // 测试提交竞赛答案
  test('should submit competition answer', async () => {
    // 先参加竞赛
    await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    // 提交竞赛答案
    const res = await request(app)
      .post('/api/submissions/competition/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId,
        questionId,
        answer: 0
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.submission.isCorrect).toBe(true);
  });

  // 测试获取竞赛排行榜
  test('should get competition ranking', async () => {
    // 先参加竞赛并提交答案
    await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    await request(app)
      .post('/api/submissions/competition/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId,
        questionId,
        answer: 0
      });

    // 获取竞赛排行榜
    const res = await request(app)
      .get(`/api/submissions/competition/${competitionId}/ranking`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });
});