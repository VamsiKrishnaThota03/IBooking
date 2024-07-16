const connectToMongo = require('./db');
const express = require('express');
const port = 5000
var cors = require('cors') 


connectToMongo();
const app = express();
app.use(express.json())
app.use(cors())


// routes
app.use('/api/auth',require('./api/auth.js'));
app.use("/api/users", require('./api/users.js'));
app.use("/api/hotels", require('./api/hotel.js'));
app.use("/api/rooms", require('./api/rooms.js'));




app.listen(port, () => {
    console.log(`iBooking backend listening at http://localhost:${port}`)
  })