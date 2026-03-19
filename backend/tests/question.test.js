// 加载环境变量
require('dotenv').config();

// 添加TextEncoder polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const Question = require('../src/models/Question');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// 测试题目功能
describe('Question Management', () => {
  let token;

  // 在所有测试前清除数据库
  beforeAll(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  // 在所有测试后清除数据库
  afterAll(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  // 在测试前创建一个管理员用户并登录
  beforeEach(async () => {
    // 清除数据库
    await Question.deleteMany({});
    await User.deleteMany({});

    // 创建管理员用户
    const uniqueAdminEmail = `admin${Date.now()}@example.com`;
    const adminUser = await User.create({
      username: `admin${Date.now()}`,
      email: uniqueAdminEmail,
      password: 'password123',
      role: 'admin'
    });

    // 登录获取token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueAdminEmail,
        password: 'password123'
      });

    token = loginRes.body.token;
  });

  // 测试添加题目
  test('should add a new question', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
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

  // 测试获取题目列表
  test('should get questions list', async () => {
    // 先添加一个题目
    await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Question',
        content: 'What is cryptography?',
        options: ['The study of secret writing', 'The study of numbers', 'The study of computers', 'The study of languages'],
        correctAnswer: 0,
        difficulty: 'easy',
        category: 'Basic',
        points: 10
      });

    // 获取题目列表
    const res = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // 测试获取单个题目
  test('should get a single question', async () => {
    // 先添加一个题目
    const addRes = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
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

    // 获取单个题目
    const res = await request(app)
      .get(`/api/questions/${questionId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Test Question');
  });
});
