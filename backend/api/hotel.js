const express = require('express');
const Hotel = require('../models/Hotel.js');
const Room = require('../models/Room.js');
const { verifyAdmin } = require('../middleware/verifyToken.js');
const { wrap } = require('../utils/error');

const router = express.Router();
const HOTEL_FIELDS = ['name', 'type', 'city', 'address', 'distance', 'photos', 'title', 'desc', 'rating', 'cheapestPrice', 'featured'];
const pick = (body) => Object.fromEntries(HOTEL_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Case-insensitive exact match for a plain string (never an operator object).
const ci = (value) => new RegExp(`^${escapeRegex(String(value).trim())}$`, 'i');

// CREATE (admin)
router.post('/', verifyAdmin, wrap(async (req, res) => {
  res.status(201).json(await Hotel.create(pick(req.body)));
}));

// UPDATE (admin)
router.put('/:id', verifyAdmin, wrap(async (req, res) => {
  const updated = await Hotel.findByIdAndUpdate(req.params.id, { $set: pick(req.body) }, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ error: 'Hotel not found' });
  return res.json(updated);
}));

// DELETE (admin)
router.delete('/:id', verifyAdmin, wrap(async (req, res) => {
  await Hotel.findByIdAndDelete(req.params.id);
  res.json('Hotel has been deleted.');
}));

// GET one
router.get('/find/:id', wrap(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  return res.json(hotel);
}));

// GET all: ?city=&type=&featured=true&min=&max=&limit=
router.get('/', wrap(async (req, res) => {
  const { city, type, featured } = req.query;
  const min = Number(req.query.min) || 0;
  const max = Number(req.query.max) || Number.MAX_SAFE_INTEGER;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const filter = { cheapestPrice: { $gte: min, $lte: max } };
  if (typeof city === 'string' && city.trim()) filter.city = ci(city);
  if (typeof type === 'string' && type.trim()) filter.type = ci(type);
  if (featured === 'true') filter.featured = true;
  res.json(await Hotel.find(filter).limit(limit));
}));

router.get('/countByCity', wrap(async (req, res) => {
  const cities = String(req.query.cities || '').split(',').map((c) => c.trim()).filter(Boolean);
  const list = await Promise.all(cities.map((city) => Hotel.countDocuments({ city: ci(city) })));
  res.json(list);
}));

router.get('/countByType', wrap(async (req, res) => {
  const types = [
    ['hotel', 'hotels'],
    ['apartment', 'apartments'],
    ['resort', 'resorts'],
    ['villa', 'villas'],
    ['cabin', 'cabins'],
  ];
  const counts = await Promise.all(types.map(([type]) => Hotel.countDocuments({ type })));
  res.json(types.map(([type, label], i) => ({ type: label, key: type, count: counts[i] })));
}));

// Rooms of a hotel
router.get('/room/:id', wrap(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  const rooms = await Room.find({ _id: { $in: hotel.rooms } });
  return res.json(rooms);
}));

module.exports = router;
