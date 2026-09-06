process.env.JWT_SECRET = 'test-secret-key-for-task5';

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const accountRoute = require('./accountRoute');

const SECRET = process.env.JWT_SECRET;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/account', accountRoute);
  return app;
}

describe('GET /api/account/session (Task 5) - protect() wired to a real route', () => {
  test('returns 401 when no Authorization header is present', async () => {
    const app = buildApp();

    const res = await request(app).get('/api/account/session');

    expect(res.status).toBe(401);
  });

  test('returns 401 for a garbage/invalid token', async () => {
    const app = buildApp();

    const res = await request(app)
      .get('/api/account/session')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });

  test('returns 200 with the decoded user for a valid token', async () => {
    const app = buildApp();
    const token = jwt.sign({ id: 1, role: 'user', email: 'a@a.com' }, SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/account/session')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 1, role: 'user', email: 'a@a.com' });
  });
});
