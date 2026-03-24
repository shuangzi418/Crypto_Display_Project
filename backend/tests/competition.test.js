require('dotenv').config();

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

const request = require('supertest');
const app = require('../src/index');
const { Competition, Question, User, CompetitionParticipant } = require('../src/models');

describe('Competition Management', () => {
  let adminToken;
  let userToken;
  let userId;
  let questionId;
  let competitionId;

  beforeAll(async () => {
    await app.ready;
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Question.deleteMany({});
    await Competition.deleteMany({});

    const uniqueAdminEmail = `admin${Date.now()}@example.com`;
    await User.create({
      username: `admin${Date.now()}`,
      email: uniqueAdminEmail,
      password: 'password123',
      role: 'admin'
    });

    const uniqueUserEmail = `test${Date.now()}@example.com`;
    const user = await User.create({
      username: `testuser${Date.now()}`,
      email: uniqueUserEmail,
      password: 'password123'
    });
    userId = user.id;

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

    const competition = await Competition.create({
      title: 'Test Competition',
      description: 'A test competition',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active',
      totalPoints: 10
    });

    await competition.setQuestions([question.id]);
    competitionId = String(competition.id);
  });

  test('should add a new competition', async () => {
    const res = await request(app)
      .post('/api/competitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'New Competition',
        description: 'A new competition',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        questions: [questionId]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('New Competition');
  });

  test('should get competitions list', async () => {
    const res = await request(app)
      .get('/api/competitions');

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].questions[0].correctAnswer).toBeUndefined();
  });

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

  test('should allow idempotent competition join', async () => {
    await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    const secondJoinRes = await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    expect(secondJoinRes.statusCode).toBe(200);
    expect(secondJoinRes.body.alreadyJoined).toBe(true);
  });

  test('should submit competition answer', async () => {
    await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

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

  test('should not award points twice for the same competition question', async () => {
    await request(app)
      .post('/api/submissions/competition/join')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId
      });

    const firstRes = await request(app)
      .post('/api/submissions/competition/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId,
        questionId,
        answer: 0
      });

    const secondRes = await request(app)
      .post('/api/submissions/competition/submit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        competitionId,
        questionId,
        answer: 0
      });

    const participant = await CompetitionParticipant.findOne({
      where: {
        competitionId,
        userId
      }
    });

    expect(firstRes.statusCode).toBe(200);
    expect(firstRes.body.points).toBe(10);
    expect(secondRes.statusCode).toBe(200);
    expect(secondRes.body.alreadySubmitted).toBe(true);
    expect(secondRes.body.points).toBe(0);
    expect(secondRes.body.competitionScore).toBe(10);
    expect(participant.score).toBe(10);
  });

  test('should get competition ranking', async () => {
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

    const res = await request(app)
      .get(`/api/submissions/competition/${competitionId}/ranking`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });
});
