const express = require('express');
const cors = require('cors');
const { port, host, corsOrigins } = require('./config');
const connectToMongo = require('./db');

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./api/auth.js'));
app.use('/api/users', require('./api/users.js'));
app.use('/api/hotels', require('./api/hotel.js'));
app.use('/api/rooms', require('./api/rooms.js'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || (err.name === 'CastError' ? 400 : err.name === 'ValidationError' ? 400 : 500);
  if (status >= 500) console.error(err);
  const message = err.name === 'CastError' ? 'Invalid id' : err.message;
  res.status(status).json({ error: status >= 500 ? 'Something went wrong' : message });
});

connectToMongo()
  .then(() => {
    app.listen(port, host, () => {
      console.log(`iBooking backend listening at http://${host}:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
