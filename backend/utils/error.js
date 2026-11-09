// Small helper to create an Error with an HTTP status.
const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Wraps an async route so rejected promises reach the error handler.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { createError, wrap };
