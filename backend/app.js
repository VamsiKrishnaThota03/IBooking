const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { corsOrigins } = require('./config');

/**
 * Build the Express application.
 *
 * Separated from index.js so tests can drive it on an ephemeral loopback port
 * instead of the real one. Nothing here calls `listen`: the bind address is
 * decided in index.js and defaults to 127.0.0.1.
 *
 * Audience note: hotel and room *reads* are deliberately anonymous — this is a
 * public booking site, and gating the listings would hide the thing the app
 * exists to show. Everything that writes goes through `verifyAdmin`, and the
 * `/api/users` routes go through `verifyUser`, which allows the account owner
 * or an admin and nobody else.
 */
function createApp() {
  const app = express();

  app.disable('x-powered-by');
  // One proxy hop on Render and similar hosts, so req.ip is the real client
  // address for the limiters. Trusting every hop would let a caller spoof
  // X-Forwarded-For and bypass them.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      // A JSON API on a different origin from the SPA: nothing here is ever
      // loaded as a subresource, so deny everything.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'none'"],
          'form-action': ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 600),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // Tighter ceiling on credentials, keyed on IP plus the submitted username so
  // one attacker behind a shared address cannot lock out everyone else.
  // Successes count too, so a valid login cannot refill an attacker's budget.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const who =
        typeof req.body?.username === 'string'
          ? req.body.username.trim().toLowerCase()
          : typeof req.body?.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';
      return `${req.ip || 'unknown'}:${who}`;
    },
    message: { error: 'Too many authentication attempts, please try again in 15 minutes.' },
  });

  app.use(globalLimiter);

  // Liveness: the process is accepting connections. Deliberately independent of
  // Mongo, so a transient database blip does not make a platform restart a
  // healthy process.
  app.get('/api/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

  // Readiness: Mongoose reports connection state 1 only once it is usable.
  app.get('/api/health/ready', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const state = states[mongoose.connection.readyState] || 'unknown';
    if (mongoose.connection.readyState === 1) {
      return res.json({ ok: true, database: state });
    }
    res.set('Retry-After', '30');
    return res.status(503).json({ ok: false, database: state });
  });

  app.use('/api/auth', authLimiter, require('./api/auth.js'));
  app.use('/api/users', require('./api/users.js'));
  app.use('/api/hotels', require('./api/hotel.js'));
  app.use('/api/rooms', require('./api/rooms.js'));

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status =
      err.status ||
      (err.name === 'CastError' ? 400 : err.name === 'ValidationError' ? 400 : 500);
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    if (status >= 500) console.error(err);
    const message = err.name === 'CastError' ? 'Invalid id' : err.message;
    // 5xx never carries an internal message; 4xx carries the validation text.
    return res.status(status).json({ error: status >= 500 ? 'Something went wrong' : message });
  });

  return app;
}

module.exports = { createApp };
