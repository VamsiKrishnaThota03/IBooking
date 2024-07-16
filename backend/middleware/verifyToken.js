var jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = 'ThisisIBook$ing';


const verifyToken = (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
      res.status(401).send({ error: "Please authenticate using a valid token" })
      
    }
    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data;
        next();
    } catch (error) {
        res.status(401).send({ error: "Please authenticate using a valid token" })
    }
};


const verifyUser = (req, res, next) => {
    verifyToken(req, res, next, () => {
      if (req.user.id === req.params.id || req.user.isAdmin) {
        next();
      } else {
        return next(createError(403, "You are not authorized!"));
      }
    });
};


const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
      // console.log(req.user);
      // console.log(req.user.isAdmin.isAdmin)
      if (req.user.isAdmin.isAdmin===true) {
        console.log("xyz")
        next();
      } else {
        res.status(401).send({ error: "You are not authorized23" })
      }
    });
};

module.exports = {verifyToken, verifyUser, verifyAdmin};
