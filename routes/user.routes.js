const express = require('express');
   const router = express.Router();
   const { body, validationResult } = require('express-validator');
   const User = require('../models/user.model');
   const bcrypt = require('bcrypt');
   const jwt = require('jsonwebtoken');
   const rateLimit = require('express-rate-limit');
   const authMiddleware = require('../middleware/auth');

   const loginLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5,
     message: 'Too many login attempts, please try again after 15 minutes',
   });

   router.post(
     '/register',
     [
       body('email').trim().isEmail().withMessage('Invalid email format'),
       body('password').trim().isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
       body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
     ],
     async (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.redirect(`/user/register?error=${encodeURIComponent(errors.array()[0].msg)}`);
       }

       try {
         const { email, username, password } = req.body;
         const existingUser = await User.findOne({ $or: [{ email }, { username }] });
         if (existingUser) {
           return res.redirect(`/user/register?error=${encodeURIComponent('Email or username already exists')}`);
         }

         const hashpassword = await bcrypt.hash(password, 10);
         const newUser = await User.create({
           email,
           username,
           password: hashpassword,
         });

         res.redirect('/user/login');
       } catch (error) {
         res.redirect(`/user/register?error=${encodeURIComponent(error.message)}`);
       }
     }
   );

   router.post(
     '/login',
     loginLimiter,
     [
       body('password').trim().isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
       body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
     ],
     async (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.redirect(`/user/login?error=${encodeURIComponent(errors.array()[0].msg)}`);
       }

       try {
         const { username, password } = req.body;
         const user = await User.findOne({ username });

         if (!user || !(await bcrypt.compare(password, user.password))) {
           return res.redirect(`/user/login?error=${encodeURIComponent('Invalid credentials')}`);
         }

         const token = jwt.sign(
           {
             userId: user._id,
             username: user.username,
           },
           process.env.JWT_SECRET,
           { expiresIn: '1h' }
         );

         res.cookie('token', token, {
           httpOnly: true,
           secure: process.env.NODE_ENV === 'production',
           sameSite: 'strict',
           maxAge: 3600000,
         });

         res.redirect('/home');
       } catch (error) {
         res.redirect(`/user/login?error=${encodeURIComponent(error.message)}`);
       }
     }
   );

   router.get('/profile', authMiddleware, async (req, res) => {
     try {
       const user = await User.findById(req.user.userId).select('username email');
       if (!user) {
         return res.status(404).json({ success: false, message: 'User not found' });
       }
       res.json({ success: true, user });
     } catch (error) {
       res.status(500).json({ success: false, message: error.message });
     }
   });

   router.post('/logout', (req, res) => {
     res.clearCookie('token', {
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production',
       sameSite: 'strict',
     });
     res.redirect('/user/login');
   });

   module.exports = router;