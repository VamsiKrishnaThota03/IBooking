/**
 * Authorization against a real MongoDB.
 *
 * `verifyUser` allows "the account owner or an admin". That rule is the one
 * worth proving with real records rather than a mock: an ordinary user must not
 * be able to read or modify another account, and must not be able to create or
 * delete hotels — while an admin can.
 *
 * Skips itself when TEST_MONGO_URI is absent, so `npm test` still passes on a
 * machine with no database; CI always provides one.
 */
process.env.JWT_SECRET = 'test-only-secret-not-used-in-any-deployment';
// High enough not to trip while the suite creates several accounts.
process.env.AUTH_RATE_LIMIT_MAX = '1000';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const uri = process.env.TEST_MONGO_URI;
const suite = uri ? describe : describe.skip;

suite('authorization (real MongoDB)', () => {
  let server;
  let base;
  let User;

  const call = (path, { method = 'GET', token, body } = {}) =>
    fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'auth-token': token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  /** Register an account and return its id plus a signed token. */
  async function createAccount(label, { isAdmin = false } = {}) {
    const unique = `${label}${Date.now()}${Math.floor(Math.random() * 1e6)}`;
    const res = await call('/api/auth/register', {
      method: 'POST',
      body: {
        username: unique,
        email: `${unique}@example.test`,
        country: 'IN',
        city: 'Hyderabad',
        phone: '1234567890',
        password: 'correct-horse',
      },
    });
    // Read the body once: a template literal in an assert message would
    // consume it before json() could parse it.
    const text = await res.text();
    assert.strictEqual(res.status, 201, `register failed: ${text}`);

    const row = await User.findOne({ username: unique });
    assert.ok(row, 'expected the user to be persisted');
    if (isAdmin) {
      // isAdmin is never settable through the API, which is the point; set it
      // directly so there is a genuine admin to test against.
      row.isAdmin = true;
      await row.save();
    }
    return {
      id: row.id,
      username: unique,
      token: jwt.sign({ id: row.id, isAdmin }, process.env.JWT_SECRET),
    };
  }

  before(async () => {
    await mongoose.connect(uri);
    await mongoose.connection.db.dropDatabase();

    User = require('../models/User');
    const { createApp } = require('../app');
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) server.close();
    await mongoose.connection.close();
  });

  test('readiness turns green once Mongo is connected', async () => {
    const res = await call('/api/health/ready');
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).database, 'connected');
  });

  test('registration persists a bcrypt hash, never the plaintext', async () => {
    const account = await createAccount('hash');
    const row = await User.findOne({ username: account.username });
    assert.notStrictEqual(row.password, 'correct-horse');
    assert.match(row.password, /^\$2[aby]\$/, 'expected a bcrypt hash');
  });

  test('registration never returns the password, and defaults isAdmin to false', async () => {
    const account = await createAccount('plain');
    const row = await User.findOne({ username: account.username });
    assert.strictEqual(row.isAdmin, false);
  });

  test('a body claiming isAdmin does not create an admin', async () => {
    const unique = `sneaky${Date.now()}`;
    const res = await call('/api/auth/register', {
      method: 'POST',
      body: {
        username: unique,
        email: `${unique}@example.test`,
        country: 'IN',
        city: 'Hyderabad',
        phone: '1234567890',
        password: 'correct-horse',
        isAdmin: true,
      },
    });
    assert.strictEqual(res.status, 201);
    const row = await User.findOne({ username: unique });
    assert.strictEqual(row.isAdmin, false, 'isAdmin must not be settable from the request body');
  });

  test('a duplicate username or email is refused', async () => {
    const account = await createAccount('dup');
    const res = await call('/api/auth/register', {
      method: 'POST',
      body: {
        username: account.username,
        email: `other-${Date.now()}@example.test`,
        country: 'IN',
        city: 'Hyderabad',
        phone: '1234567890',
        password: 'correct-horse',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.match((await res.json()).error, /already exists/i);
  });

  test('login works with the right password and leaks no hash', async () => {
    const account = await createAccount('login');

    const ok = await call('/api/auth/login', {
      method: 'POST',
      body: { username: account.username, password: 'correct-horse' },
    });
    assert.strictEqual(ok.status, 200);
    const body = await ok.json();
    assert.ok(body.authtoken);
    assert.strictEqual(body.user.password, undefined);

    const bad = await call('/api/auth/login', {
      method: 'POST',
      body: { username: account.username, password: 'wrong-horse' },
    });
    assert.strictEqual(bad.status, 400);
  });

  test('a user can read their own record but not another account\'s', async () => {
    const alice = await createAccount('alice');
    const bob = await createAccount('bob');

    const own = await call(`/api/users/${alice.id}`, { token: alice.token });
    assert.strictEqual(own.status, 200);

    const other = await call(`/api/users/${bob.id}`, { token: alice.token });
    assert.strictEqual(other.status, 403, 'reading another account must be refused');
  });

  test('a user cannot delete or edit another account', async () => {
    const alice = await createAccount('alice2');
    const bob = await createAccount('bob2');

    const del = await call(`/api/users/${bob.id}`, { method: 'DELETE', token: alice.token });
    assert.strictEqual(del.status, 403);

    const edit = await call(`/api/users/${bob.id}`, {
      method: 'PUT',
      token: alice.token,
      body: { city: 'Hijacked' },
    });
    assert.strictEqual(edit.status, 403);

    // Bob's record must be untouched.
    const row = await User.findById(bob.id);
    assert.ok(row, 'Bob should still exist');
    assert.notStrictEqual(row.city, 'Hijacked');
  });

  test('an admin can list users; an ordinary user cannot', async () => {
    const admin = await createAccount('admin', { isAdmin: true });
    const user = await createAccount('ordinary');

    const asAdmin = await call('/api/users', { token: admin.token });
    assert.strictEqual(asAdmin.status, 200);
    assert.ok(Array.isArray(await asAdmin.json()));

    const asUser = await call('/api/users', { token: user.token });
    assert.strictEqual(asUser.status, 403);
  });

  test('only an admin can create a hotel', async () => {
    const admin = await createAccount('hoteladmin', { isAdmin: true });
    const user = await createAccount('hoteluser');

    const hotel = {
      name: 'Test Hotel',
      type: 'hotel',
      city: 'Hyderabad',
      address: '1 Test Street',
      distance: '500',
      title: 'A place to sleep',
      desc: 'Clean and quiet.',
      cheapestPrice: 2000,
      photos: [],
    };

    const refused = await call('/api/hotels', { method: 'POST', token: user.token, body: hotel });
    assert.strictEqual(refused.status, 403);

    const created = await call('/api/hotels', { method: 'POST', token: admin.token, body: hotel });
    // Read the body once; a template literal in the assert message would
    // consume it first. The route answers 201 on create.
    const createdText = await created.text();
    assert.strictEqual(created.status, 201, createdText);

    // And the listing is readable anonymously, because this is a public site.
    const list = await call('/api/hotels');
    assert.strictEqual(list.status, 200);
    assert.ok((await list.json()).length >= 1);
  });
});
