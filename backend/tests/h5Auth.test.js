if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { H5User, H5ChallengeAttempt } = require('../src/h5/models');

describe('H5 Authentication', () => {
  beforeAll(async () => {
    await app.ready;
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});
  });

  afterAll(async () => {
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});
  });

  beforeEach(async () => {
    await H5ChallengeAttempt.deleteMany({});
    await H5User.deleteMany({});
  });

  test('should register and return h5 profile', async () => {
    const agent = request.agent(app);

    const registerRes = await agent
      .post('/api/h5-auth/register')
      .send({
        username: 'mobile-user'
      });

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.username).toBe('mobile-user');

    const profileRes = await agent
      .get('/api/h5-auth/profile');

    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.username).toBe('mobile-user');

    const sessionRes = await agent
      .get('/api/h5-auth/session');

    expect(sessionRes.statusCode).toBe(200);
    expect(sessionRes.body.authenticated).toBe(true);
    expect(sessionRes.body.user.username).toBe('mobile-user');
  });

  test('should login with nickname only', async () => {
    await H5User.create({
      username: 'login-user'
    });

    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/h5-auth/login')
      .send({
        username: 'login-user'
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.username).toBe('login-user');
  });

  test('should access with nickname only and reuse existing account', async () => {
    const firstAgent = request.agent(app);
    const firstAccessRes = await firstAgent
      .post('/api/h5-auth/access')
      .send({
        username: 'quick-user'
      });

    expect(firstAccessRes.statusCode).toBe(201);
    expect(firstAccessRes.body.username).toBe('quick-user');
    expect(firstAccessRes.body.accessMode).toBe('register');
    expect(await H5User.count({ where: { username: 'quick-user' } })).toBe(1);

    const secondAgent = request.agent(app);
    const secondAccessRes = await secondAgent
      .post('/api/h5-auth/access')
      .send({
        username: 'quick-user'
      });

    expect(secondAccessRes.statusCode).toBe(200);
    expect(secondAccessRes.body.username).toBe('quick-user');
    expect(secondAccessRes.body.accessMode).toBe('login');
    expect(await H5User.count({ where: { username: 'quick-user' } })).toBe(1);
  });

  test('should return unauthenticated session without 401', async () => {
    const res = await request(app)
      .get('/api/h5-auth/session');

    expect(res.statusCode).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  test('should query only awarded records while logged out', async () => {
    const user = await H5User.create({
      username: 'award-user'
    });

    await H5ChallengeAttempt.create({
      userId: user.id,
      medalTier: 'bronze',
      medalTitle: '安全卫士·铜徽',
      correctCount: 15,
      answeredCount: 20,
      totalQuestions: 20
    });

    await H5ChallengeAttempt.create({
      userId: user.id,
      medalTier: 'encourage',
      medalTitle: '继续加油',
      correctCount: 10,
      answeredCount: 20,
      totalQuestions: 20
    });

    const res = await request(app)
      .post('/api/h5-auth/award-records/query')
      .send({
        username: 'award-user'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.awards).toHaveLength(1);
    expect(res.body.awards[0].medalTier).toBe('silver');
    expect(res.body.awards[0].medalTitle).toBe('密码安全银奖');
  });
});
