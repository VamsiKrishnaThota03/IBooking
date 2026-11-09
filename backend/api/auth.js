const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config');
const { wrap } = require('../utils/error');

const router = express.Router();
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// ROUTE 1: Create a user: POST /api/auth/register. No login required.
router.post(
  '/register',
  wrap(async (req, res) => {
    const fields = {
      username: str(req.body.username),
      email: str(req.body.email).toLowerCase(),
      country: str(req.body.country),
      city: str(req.body.city),
      phone: str(req.body.phone),
    };
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const missing = Object.keys(fields).filter((k) => !fields[k]);
    if (missing.length) return res.status(400).json({ success: false, error: `Missing: ${missing.join(', ')}` });
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) return res.status(400).json({ success: false, error: 'Enter a valid email' });
    if (password.length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ $or: [{ email: fields.email }, { username: fields.username }] });
    if (existing) {
      return res.status(400).json({ success: false, error: 'A user with this email or username already exists' });
    }

    // isAdmin is never taken from the request body.
    const hash = await bcrypt.hash(password, 10);
    await User.create({ ...fields, password: hash });
    return res.status(201).json({ success: true, message: 'User has been created.' });
  })
);

// ROUTE 2: Log in: POST /api/auth/login. No login required.
router.post(
  '/login',
  wrap(async (req, res) => {
    const username = str(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = username ? await User.findOne({ username }) : null;
    const ok = user && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(400).json({ success: false, error: 'Wrong username or password' });

    const authtoken = jwt.sign({ id: user.id, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: '7d' });
    return res.json({
      success: true,
      authtoken,
      user: { _id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin },
    });
  })
);

module.exports = router;
