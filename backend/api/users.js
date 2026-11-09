const express = require('express');
const bcrypt = require('bcrypt');
const { verifyAdmin, verifyUser } = require('../middleware/verifyToken.js');
const User = require('../models/User');
const { wrap } = require('../utils/error');

const router = express.Router();
const EDITABLE = ['username', 'email', 'country', 'city', 'phone', 'img'];

// GET all users (admin)
router.get('/', verifyAdmin, wrap(async (req, res) => {
  res.json(await User.find().select('-password'));
}));

// UPDATE own profile (or admin). isAdmin can't be changed here.
router.put('/:id', verifyUser, wrap(async (req, res) => {
  const update = {};
  EDITABLE.forEach((k) => {
    if (typeof req.body[k] === 'string') update[k] = req.body[k].trim();
  });
  if (typeof req.body.password === 'string' && req.body.password.length >= 6) {
    update.password = await bcrypt.hash(req.body.password, 10);
  }
  const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).select('-password');
  if (!updatedUser) return res.status(404).json({ error: 'User not found' });
  return res.json(updatedUser);
}));

// DELETE own account (or admin)
router.delete('/:id', verifyUser, wrap(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json('User has been deleted.');
}));

// GET one user (self or admin)
router.get('/:id', verifyUser, wrap(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
}));

module.exports = router;
