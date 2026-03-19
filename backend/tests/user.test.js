// 添加TextEncoder polyfill
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const User = require('../src/models/User');
const mongoose = require('mongoose');

// 测试用户认证功能
describe('User Authentication', () => {
  // 在所有测试前清除数据库
  beforeAll(async () => {
    await User.deleteMany({});
  });

  // 在所有测试后清除数据库
  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // 在测试前清除数据库
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // 测试用户注册
  test('should register a new user', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('testuser');
    expect(res.body.email).toBe(uniqueEmail);
  });

  // 测试用户登录
  test('should login existing user', async () => {
    // 先注册一个用户
    const uniqueEmail = `test${Date.now()}@example.com`;
    await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    // 然后登录
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  // 测试获取用户个人资料
  test('should get user profile', async () => {
    // 先注册一个用户
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const token = registerRes.body.token;

    // 使用token获取个人资料
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testuser');
    expect(res.body.email).toBe(uniqueEmail);
  });
});