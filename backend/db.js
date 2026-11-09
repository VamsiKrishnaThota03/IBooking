const mongoose = require('mongoose');
const { mongoURI } = require('./config');

const connectToMongo = async () => {
  await mongoose.connect(mongoURI);
  console.log('Mongoose is connected');
};

module.exports = connectToMongo;
