// Loads sample hotels and rooms into MongoDB (replaces existing hotels and rooms).
// Optionally creates an admin user when SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are set.
// Usage: npm run seed
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { mongoURI } = require('./config');
const Hotel = require('./models/Hotel');
const Room = require('./models/Room');
const User = require('./models/User');

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=60`;
const PHOTOS = {
  pool: img('1566073771259-6a8506099945'),
  palms: img('1551882547-ff40c63fe5fa'),
  night: img('1542314831-068cd1dbfeeb'),
  tropic: img('1520250497591-112f2f40a3f4'),
  lobby: img('1571896349842-33c89424de2d'),
  room1: img('1582719478250-c89cae4dc85b'),
  room2: img('1590490360182-c33d57733427'),
  room3: img('1611892440504-42a792e24d32'),
  room4: img('1578683010236-d716f9a3f461'),
  room5: img('1505693416388-ac5ce068fe85'),
  flat1: img('1502672260266-1c1ef2d93688'),
  flat2: img('1522708323590-d24dbb6b0267'),
  flat3: img('1560448204-e02f11c3d0e2'),
  tower: img('1568084680786-a84f91d1153c'),
  villa: img('1613490493576-7fde63acd811'),
  cabin1: img('1449158743715-0a90ebb6d2d8'),
  cabin2: img('1587061949409-02df41d5e562'),
  cabin3: img('1510798831971-661eb04b3739'),
};

const hotels = [
  { name: 'Spree Riverside Hotel', type: 'hotel', city: 'berlin', address: 'Friedrichstraße 101, Berlin', distance: '400', title: 'Modern rooms by the river', desc: 'A calm, modern hotel a short walk from the Brandenburg Gate, with a rooftop bar and a generous breakfast buffet.', rating: 4.6, cheapestPrice: 120, featured: true, photos: [PHOTOS.lobby, PHOTOS.room1, PHOTOS.room2, PHOTOS.room3, PHOTOS.pool, PHOTOS.room5] },
  { name: 'Kreuzberg Loft Apartments', type: 'apartment', city: 'berlin', address: 'Oranienstraße 12, Berlin', distance: '1800', title: 'Bright lofts in Kreuzberg', desc: 'Spacious self-catering apartments with a full kitchen, fast Wi-Fi and cafés on the doorstep.', rating: 4.3, cheapestPrice: 95, photos: [PHOTOS.flat1, PHOTOS.flat2, PHOTOS.flat3, PHOTOS.room4] },
  { name: 'Gran Vía Palace', type: 'hotel', city: 'madrid', address: 'Gran Vía 24, Madrid', distance: '250', title: 'Classic elegance on Gran Vía', desc: 'Grand rooms, a rooftop pool and tapas bars all around. Ideal for exploring the centre on foot.', rating: 4.8, cheapestPrice: 160, featured: true, photos: [PHOTOS.night, PHOTOS.room2, PHOTOS.room3, PHOTOS.palms, PHOTOS.room1, PHOTOS.room5] },
  { name: 'Retiro Park Villa', type: 'villa', city: 'madrid', address: 'Calle de Alfonso XII 8, Madrid', distance: '1200', title: 'Private villa near Retiro Park', desc: 'A four-bedroom villa with a private pool and garden, perfect for families and groups.', rating: 4.9, cheapestPrice: 340, featured: true, photos: [PHOTOS.villa, PHOTOS.room4, PHOTOS.flat3, PHOTOS.pool] },
  { name: 'Thames View Hotel', type: 'hotel', city: 'london', address: '12 South Bank, London', distance: '600', title: 'Skyline views over the Thames', desc: 'Comfortable rooms with river views, minutes from the London Eye and Borough Market.', rating: 4.4, cheapestPrice: 180, featured: true, photos: [PHOTOS.tower, PHOTOS.room1, PHOTOS.room5, PHOTOS.room3] },
  { name: 'Camden Studio Flats', type: 'apartment', city: 'london', address: '33 Camden High St, London', distance: '3500', title: 'Studios in lively Camden', desc: 'Compact studios with kitchenettes, close to the market and the Tube.', rating: 4.0, cheapestPrice: 110, photos: [PHOTOS.flat2, PHOTOS.flat1, PHOTOS.room4] },
  { name: 'Palm Bay Resort', type: 'resort', city: 'bali', address: 'Jalan Pantai 5, Bali', distance: '9000', title: 'Beachfront resort and spa', desc: 'Infinity pools, a spa and private beach access surrounded by tropical gardens.', rating: 4.7, cheapestPrice: 210, photos: [PHOTOS.tropic, PHOTOS.palms, PHOTOS.pool, PHOTOS.room2] },
  { name: 'Black Forest Cabin', type: 'cabin', city: 'freiburg', address: 'Schwarzwaldweg 3, Freiburg', distance: '15000', title: 'A quiet cabin in the woods', desc: 'A cosy wooden cabin with a fireplace and hiking trails right outside the door.', rating: 4.5, cheapestPrice: 85, photos: [PHOTOS.cabin2, PHOTOS.cabin1, PHOTOS.cabin3] },
];

const roomTemplates = [
  { title: 'Standard Double Room', maxPeople: 2, desc: 'King bed, 1 bathroom, balcony.', factor: 1, numbers: [101, 102, 103] },
  { title: 'Family Suite', maxPeople: 4, desc: 'Two bedrooms, sofa bed, kitchenette.', factor: 1.8, numbers: [201, 202] },
];

(async () => {
  await mongoose.connect(mongoURI);
  await Room.deleteMany({});
  await Hotel.deleteMany({});
  for (const data of hotels) {
    const rooms = await Room.insertMany(
      roomTemplates.map((t) => ({
        title: t.title,
        maxPeople: t.maxPeople,
        desc: t.desc,
        price: Math.round(data.cheapestPrice * t.factor),
        roomNumbers: t.numbers.map((number) => ({ number, unavailableDates: [] })),
      }))
    );
    await Hotel.create({ ...data, rooms: rooms.map((r) => r.id) });
  }
  console.log(`Seeded ${hotels.length} hotels with ${hotels.length * roomTemplates.length} room types`);

  const { SEED_ADMIN_USERNAME: username, SEED_ADMIN_PASSWORD: password } = process.env;
  if (username && password) {
    const hash = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { username },
      { username, email: `${username}@example.com`, country: 'N/A', city: 'N/A', phone: 'N/A', password: hash, isAdmin: true },
      { upsert: true }
    );
    console.log(`Admin user "${username}" is ready`);
  }
  await mongoose.disconnect();
})().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
