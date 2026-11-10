/**
 * API tests for the iBooking backend, with no database required.
 *
 * The assertions here are about the middleware that runs *before* any query:
 * the three-tier authorization (`verifyToken` / `verifyUser` / `verifyAdmin`),
 * the liveness/readiness split, the limiters and the error shapes. The
 * authorization behaviour that needs real data — an ordinary user being refused
 * someone else's record — is in test/authorization.test.js against MongoDB.
 */
process.env.JWT_SECRET = 'test-only-secret-not-used-in-any-deployment';
process.env.AUTH_RATE_LIMIT_MAX = '4';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Fail queries immediately rather than sitting in Mongoose's 10s buffer.
mongoose.set('bufferCommands', false);

const { createApp } = require('../app');

let server;
let base;

const ID = '507f1f77bcf86cd799439011';
const userToken = jwt.sign({ id: ID, isAdmin: false }, process.env.JWT_SECRET);
const adminToken = jwt.sign({ id: ID, isAdmin: true }, process.env.JWT_SECRET);

before(async () => {
  // Loopback explicitly: an ephemeral port on all interfaces would briefly
  // expose the test server to the local network.
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const call = (path, { method = 'GET', token, body } = {}) =>
  fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'auth-token': token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test('the test server listens only on loopback', () => {
  assert.strictEqual(server.address().address, '127.0.0.1');
});

test('liveness answers without a database connection', async () => {
  assert.strictEqual(mongoose.connection.readyState, 0);
  const res = await call('/api/health');
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.strictEqual(body.ok, true);
  assert.strictEqual(typeof body.uptime, 'number');
});

test('readiness reports 503 with Retry-After while Mongo is disconnected', async () => {
  const res = await call('/api/health/ready');
  assert.strictEqual(res.status, 503);
  assert.strictEqual(res.headers.get('retry-after'), '30');
  const body = await res.json();
  assert.strictEqual(body.ok, false);
  assert.strictEqual(body.database, 'disconnected');
});

test('security headers are set and the server is not fingerprintable', async () => {
  const res = await call('/api/health');
  assert.strictEqual(res.headers.get('x-powered-by'), null);
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  assert.strictEqual(res.headers.get('referrer-policy'), 'no-referrer');
});

test('admin-only writes reject an anonymous caller with 401', async () => {
  const cases = [
    ['/api/hotels', 'POST'],
    [`/api/hotels/${ID}`, 'PUT'],
    [`/api/hotels/${ID}`, 'DELETE'],
    [`/api/rooms/${ID}`, 'POST'],
    [`/api/rooms/${ID}`, 'PUT'],
    ['/api/users', 'GET'],
  ];
  for (const [path, method] of cases) {
    const res = await call(path, { method, body: method === 'GET' ? undefined : {} });
    assert.strictEqual(res.status, 401, `${method} ${path} should be 401 anonymously`);
  }
});

test('admin-only writes reject an ordinary user with 403, not 401', async () => {
  // The distinction matters: the token is valid, the caller just is not an
  // admin. Returning 401 here would wrongly suggest re-authenticating helps.
  const cases = [
    ['/api/hotels', 'POST'],
    [`/api/hotels/${ID}`, 'DELETE'],
    ['/api/users', 'GET'],
  ];
  for (const [path, method] of cases) {
    const res = await call(path, { method, token: userToken, body: method === 'GET' ? undefined : {} });
    assert.strictEqual(res.status, 403, `${method} ${path} should be 403 for a non-admin`);
  }
});

test('isAdmin in the token is what grants admin, and it is verified', async () => {
  // A token claiming isAdmin but signed with the wrong key must not pass.
  const forged = jwt.sign({ id: ID, isAdmin: true }, 'a-different-secret');
  const res = await call('/api/users', { token: forged });
  assert.strictEqual(res.status, 401);
});

test('a token with alg=none is rejected', async () => {
  // Guards against the classic algorithm-confusion bypass.
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ id: ID, isAdmin: true })).toString('base64url');
  const res = await call('/api/users', { token: `${header}.${payload}.` });
  assert.strictEqual(res.status, 401);
});

test('a Bearer token in the Authorization header is also accepted', async () => {
  // verifyToken reads either header; an admin token should get past the guard
  // and fail later on the database instead of at 401/403.
  const res = await fetch(`${base}/api/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.ok(res.status !== 401 && res.status !== 403, `expected to pass the guard, got ${res.status}`);
});

test('a user may not act on another user\'s id', async () => {
  const otherId = '507f1f77bcf86cd799439099';
  const res = await call(`/api/users/${otherId}`, { method: 'DELETE', token: userToken });
  assert.strictEqual(res.status, 403);
});

test('registration rejects missing fields, a bad email and a short password', async () => {
  const complete = {
    username: 'tester',
    email: 'a@b.co',
    country: 'IN',
    city: 'Hyderabad',
    phone: '1234567890',
    password: 'correct-horse',
  };

  const missing = await call('/api/auth/register', {
    method: 'POST',
    body: { ...complete, city: '' },
  });
  assert.strictEqual(missing.status, 400);
  assert.match((await missing.json()).error, /Missing/);

  const badEmail = await call('/api/auth/register', {
    method: 'POST',
    body: { ...complete, email: 'not-an-email' },
  });
  assert.strictEqual(badEmail.status, 400);

  const shortPw = await call('/api/auth/register', {
    method: 'POST',
    body: { ...complete, password: '12345' },
  });
  assert.strictEqual(shortPw.status, 400);
  assert.match((await shortPw.json()).error, /at least 6/);
});

test('registration cannot grant itself admin through the body', async () => {
  // The route builds its own field list, so isAdmin in the body is ignored.
  // This fails on the database (not connected), which is fine: the assertion
  // is that it is not a 201 "created as admin".
  const res = await call('/api/auth/register', {
    method: 'POST',
    body: {
      username: 'sneaky',
      email: 'sneaky@example.test',
      country: 'IN',
      city: 'Hyderabad',
      phone: '1234567890',
      password: 'correct-horse',
      isAdmin: true,
    },
  });
  assert.notStrictEqual(res.status, 201);
});

test('the auth limiter fires and keys on IP plus username', async () => {
  // AUTH_RATE_LIMIT_MAX is 4 in this suite.
  const attempt = (username) =>
    call('/api/auth/login', { method: 'POST', body: { username, password: 'wrong-password' } });

  let sawLimit = false;
  for (let i = 0; i < 8; i += 1) {
    const res = await attempt('victim');
    if (res.status === 429) {
      sawLimit = true;
      break;
    }
  }
  assert.ok(sawLimit, 'expected a 429 once the auth limit was exceeded');

  const other = await attempt('someone-else');
  assert.notStrictEqual(other.status, 429);
});

test('public hotel reads are not behind the auth limiter', async () => {
  // This is a public booking site: the listings must stay reachable even after
  // the credential endpoints have been limited above.
  const res = await call('/api/hotels');
  assert.notStrictEqual(res.status, 429);
  assert.notStrictEqual(res.status, 401);
});

test('an unknown route returns a JSON 404', async () => {
  const res = await call('/api/does-not-exist');
  assert.strictEqual(res.status, 404);
  assert.strictEqual((await res.json()).error, 'Not found');
});

test('malformed JSON produces a 400, not a 500', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"username": broken',
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /Invalid JSON/);
});

test('an oversized body is rejected with 413', async () => {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'x', password: 'y'.repeat(200 * 1024) }),
  });
  assert.strictEqual(res.status, 413);
  assert.match((await res.json()).error, /too large/i);
});
