const express = require('express');
const Room = require('../models/Room.js');
const Hotel = require('../models/Hotel.js');
const { verifyAdmin, verifyToken } = require('../middleware/verifyToken.js');
const { wrap } = require('../utils/error');

const router = express.Router();
const ROOM_FIELDS = ['title', 'price', 'maxPeople', 'desc', 'roomNumbers'];
const pick = (body) => Object.fromEntries(ROOM_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

// CREATE a room in a hotel (admin)
router.post('/:hotelid', verifyAdmin, wrap(async (req, res) => {
  const hotel = await Hotel.findById(req.params.hotelid);
  if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
  const savedRoom = await Room.create(pick(req.body));
  await Hotel.findByIdAndUpdate(hotel.id, { $push: { rooms: savedRoom.id } });
  return res.status(201).json(savedRoom);
}));

// RESERVE: add dates to a room number's unavailableDates (logged-in users).
// :id is the _id of an entry in roomNumbers.
router.put('/availability/:id', verifyToken, wrap(async (req, res) => {
  const dates = (Array.isArray(req.body.dates) ? req.body.dates : [])
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (!dates.length || dates.length > 365) return res.status(400).json({ error: 'Provide 1 to 365 valid dates' });

  // Refuse if any of the dates is already taken.
  const room = await Room.findOne({ 'roomNumbers._id': req.params.id });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const roomNumber = room.roomNumbers.id(req.params.id);
  const taken = new Set(roomNumber.unavailableDates.map((d) => d.getTime()));
  if (dates.some((d) => taken.has(d.getTime()))) {
    return res.status(409).json({ error: `Room ${roomNumber.number} is already booked for some of these dates` });
  }
  await Room.updateOne(
    { 'roomNumbers._id': req.params.id },
    { $push: { 'roomNumbers.$.unavailableDates': { $each: dates } } }
  );
  return res.json('Room status has been updated.');
}));

// UPDATE a room (admin)
router.put('/:id', verifyAdmin, wrap(async (req, res) => {
  const updatedRoom = await Room.findByIdAndUpdate(req.params.id, { $set: pick(req.body) }, { new: true, runValidators: true });
  if (!updatedRoom) return res.status(404).json({ error: 'Room not found' });
  return res.json(updatedRoom);
}));

// DELETE a room (admin)
router.delete('/:id/:hotelid', verifyAdmin, wrap(async (req, res) => {
  await Room.findByIdAndDelete(req.params.id);
  await Hotel.findByIdAndUpdate(req.params.hotelid, { $pull: { rooms: req.params.id } });
  res.json('Room has been deleted.');
}));

// GET one
router.get('/:id', wrap(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  return res.json(room);
}));

// GET all
router.get('/', wrap(async (req, res) => {
  res.json(await Room.find());
}));

module.exports = router;
