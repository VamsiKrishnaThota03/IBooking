const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Reads the JWT from the `auth-token` header (or `Authorization: Bearer`).
const verifyToken = (req, res, next) => {
  const bearer = (req.header('authorization') || '').replace(/^Bearer\s+/i, '');
  const token = req.header('auth-token') || bearer;
  if (!token) {
    return res.status(401).json({ error: 'Please authenticate using a valid token' });
  }
  try {
    const data = jwt.verify(token, jwtSecret);
    req.user = { id: data.id, isAdmin: data.isAdmin === true };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Please authenticate using a valid token' });
  }
};

// The user themself or an admin.
const verifyUser = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin) return next();
    return res.status(403).json({ error: 'You are not authorized' });
  });
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) return next();
    return res.status(403).json({ error: 'Admin access required' });
  });
};

module.exports = { verifyToken, verifyUser, verifyAdmin };
