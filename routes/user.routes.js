const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// router.get('/test',(req,res)=>{
//     res.send('user test route')
// })

router.get("/register", (req, res) => {
  res.render("register");
});
router.post(
  "/register",
  body("email").trim().isEmail(),
  body("password").trim().isLength({ min: 5 }),
  body("username").trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        messsage: "invalid data",
      });
    }
    const { email, username, password } = req.body;
    const hashpassword = await bcrypt.hash(password, 10);
    const newUser = await userModel.create({
      email,
      username,
      password: hashpassword,
    });
    res.json(newUser);
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  body("password").trim().isLength({ min: 5 }),
  body("username").trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        message: "invalid data",
      });
    }
    const { username, password } = req.body;
    const user = await userModel.findOne({
      username: username,
    });
    if (!user) {
      return res.status(400).json({
        message: "username or password is wrong",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "username or password is incorrect",
      });
    }
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        password: user.password,
      },
      process.env.JWT_SECRET
    );
   res.cookie('token',token)
   res.send('logged in')
  }
);

module.exports = router;
