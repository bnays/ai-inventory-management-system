process.env.JWT_SECRET = 'test-secret-key-for-be1';

const jwt = require('jsonwebtoken');
const { protect } = require('./authMiddleware');

const SECRET = process.env.JWT_SECRET;

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('protect (JWT middleware) - BE1', () => {
  test('rejects requests with no Authorization header (401, next not called)', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    protect()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a garbage/invalid token (401, next not called)', () => {
    const req = { headers: { authorization: 'Bearer not-a-real-token' } };
    const res = mockRes();
    const next = jest.fn();

    protect()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects a token signed with the wrong secret (401, next not called)', () => {
    const token = jwt.sign({ id: 1, role: 'admin', email: 'a@a.com' }, 'wrong-secret', { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejects an expired token (401, next not called)', () => {
    const token = jwt.sign({ id: 4, role: 'admin', email: 'x@a.com' }, SECRET, { expiresIn: '-10s' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect()(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows a valid token through with no role restriction and attaches decoded payload to req.user', () => {
    const token = jwt.sign({ id: 1, role: 'user', email: 'a@a.com' }, SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect()(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 1, role: 'user', email: 'a@a.com' });
  });

  test('allows a valid token through when its role is in the allowed roles list', () => {
    const token = jwt.sign({ id: 2, role: 'admin', email: 'admin@a.com' }, SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect(['admin', 'user'])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('rejects a valid token whose role is not in the allowed roles list (403, next not called)', () => {
    const token = jwt.sign({ id: 3, role: 'user', email: 'u@a.com' }, SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    protect(['admin'])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
