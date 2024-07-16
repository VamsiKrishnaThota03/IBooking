const express = require('express');
const Room = require('../models/Room.js');
const Hotel = require('../models/Hotel.js');

const { verifyAdmin, verifyToken, verifyUser } = require('../middleware/verifyToken.js');


const router = express.Router();


//CREATE
router.post("/:hotelid", verifyAdmin, async (req, res) => {
    const hotelId = req.params.hotelid;
    const newRoom = new Room(req.body);

    try {
        const savedRoom = await newRoom.save();
        try {
            await Hotel.findByIdAndUpdate(hotelId, {
                $push: { rooms: savedRoom._id },
            });
        } catch (err) {
            res.status(500).send("some error occured");

        }
        res.status(200).json(savedRoom);
    } catch (err) {
        res.status(500).send("some error occured");
    }
});




//UPDATE room 
router.put("/availability/:id", async (req, res) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.status(200).json(updatedRoom);
    } catch (err) {
        res.status(500).send("some error occured");
    }
});

// update room availablity
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        await Room.updateOne(
            { "roomNumbers._id": req.params.id },
            {
                $push: {
                    "roomNumbers.$.unavailableDates": req.body.dates
                },
            }
        );
        res.status(200).json("Room status has been updated.");
    } catch (err) {
        res.status(500).send("some error occured");
    }
});



//DELETE
router.delete("/:id/:hotelid", verifyAdmin, async (req, res) => {
    const hotelId = req.params.hotelid;
    try {
        await Room.findByIdAndDelete(req.params.id);
        try {
            await Hotel.findByIdAndUpdate(hotelId, {
                $pull: { rooms: req.params.id },
            });
        } catch (err) {
            res.status(500).send("some error occured");

        }
        res.status(200).json("Room has been deleted.");
    } catch (err) {
        res.status(500).send("some error occured");
    }
});



//GET
router.get("/:id", async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        res.status(200).json(room);
    } catch (err) {
        res.status(500).send("some error occured");
    }
});



//GET ALL
router.get("/", async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).json(rooms);
    } catch (err) {
        res.status(500).send("some error occured");
    }
});

module.exports = router;