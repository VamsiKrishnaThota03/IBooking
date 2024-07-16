const mongoose = require('mongoose');

const mongoURI = "mongodb://localhost:27017/IBookingdb";

const connectToMongo= async()=>{
    await mongoose.connect(mongoURI)
    console.log("Mongoose is connected");
    
}

module.exports = connectToMongo