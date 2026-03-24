if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { User } = require('../src/models');

describe('User Authentication', () => {
  beforeAll(async () => {
    await app.ready;
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

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

  test('should login existing user', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('should get user profile', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const token = registerRes.body.token;

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testuser');
    expect(res.body.email).toBe(uniqueEmail);
  });

  test('should require current password when changing password', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const token = registerRes.body.token;

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        password: 'newpassword123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Current password is required');
  });

  test('should update password with current password', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const token = registerRes.body.token;

    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'testuser',
        email: uniqueEmail,
        currentPassword: 'password123',
        password: 'newpassword123'
      });

    expect(updateRes.statusCode).toBe(200);

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueEmail,
        password: 'newpassword123'
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  test('should reject access token on refresh endpoint', async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: uniqueEmail,
        password: 'password123'
      });

    const res = await request(app)
      .post('/api/users/refresh-token')
      .send({
        refreshToken: registerRes.body.token
      });

    expect(res.statusCode).toBe(401);
  });
});
