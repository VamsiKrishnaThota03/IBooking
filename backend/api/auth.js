const User = require('../models/User');
// const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
// var fetchuser = require('../middleware/fetchuser');


const JWT_SECRET = 'ThisisIBook$ing';


// ROUTE 1: Create a User using: POST "/api/auth/register". No login required
router.post('/register',async(req,res)=>{
    // console.log("Hello Vamsi!");
    // res.send("Hello Vamsi!");
    try {

        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({success, error: "Sorry a user with this email already exists" })
        }


        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
    
        const newUser = new User({
          ...req.body,
          password: hash,
        });
    
        await newUser.save();
        res.status(200).send("User has been created.");
      } catch (err) {
        res.status(404).send({"error": err})
      }
});


// ROUTE 2: Login a User using: POST "/api/auth/login". No login required
router.post('/login',async(req,res)=>{
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return next(createError(404, "User not found!"));
    
        const isPasswordCorrect = await bcrypt.compare(
          req.body.password,
          user.password
        );
        if (!isPasswordCorrect)
          return next(createError(400, "Wrong password or username!"));
    
        // const token = jwt.sign(
        //   { id: user._id, isAdmin: user.isAdmin },
        //   process.env.JWT
        // );


        // const data = {
        //     id: user._id,
        //     isAdmin: user.isAdmin
        //   }
        //   const token = jwt.sign(
        //     { id: user._id, isAdmin: user.isAdmin },
        //     process.env.JWT
        //   );
      

    
        // const { password, isAdmin, ...otherDetails } = user._doc;
        // res.cookie("access_token", token, {
        //     httpOnly: true,
        //   })
        //   .status(200)
        //   .json({ details: { ...otherDetails }, isAdmin });

        const data = {
            user: {
                id: user._id
            },
            isAdmin:{
                isAdmin: user.isAdmin
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success = true;
        res.json({ success, authtoken })

      } catch (err) {
        res.status(404).send({"error": err})
      }
})



module.exports = router