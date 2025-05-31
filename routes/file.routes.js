// const express = require("express");
// const router = express.Router();
// const { body, validationResult } = require("express-validator");
// const userModel = require("../models/user.model");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");

// // router.get('/test',(req,res)=>{
// //     res.send('user test route')
// // })

// router.get("/register", (req, res) => {
//   res.render("register");
// });
// router.post(
//   "/register",
//   body("email").trim().isEmail(),
//   body("password").trim().isLength({ min: 5 }),
//   body("username").trim().isLength({ min: 3 }),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//         messsage: "invalid data",
//       });
//     }
//     const { email, username, password } = req.body;
//     const hashpassword = await bcrypt.hash(password, 10);
//     const newUser = await userModel.create({
//       email,
//       username,
//       password: hashpassword,
//     });
//     res.json(newUser);
//   }
// );

// router.get("/login", (req, res) => {
//   res.render("login");
// });

// router.post(
//   "/login",
//   body("password").trim().isLength({ min: 5 }),
//   body("username").trim().isLength({ min: 3 }),
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         errors: errors.array(),
//         message: "invalid data",
//       });
//     }
//     const { username, password } = req.body;
//     const user = await userModel.findOne({
//       username: username,
//     });
//     if (!user) {
//       return res.status(400).json({
//         message: "username or password is wrong",
//       });
//     }
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({
//         message: "username or password is incorrect",
//       });
//     }
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         email: user.email,
//         password: user.password,
//       },
//       process.env.JWT_SECRET
//     );
//    res.cookie('token',token)
//    res.send('logged in')
//   }
// );

// module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { File, gfs } = require('../models/file.model');
const { verifyToken } = require('../middleware/auth');
const mongoose = require('mongoose');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const writeStream = gfs.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype
    });

    writeStream.end(req.file.buffer);

    writeStream.on('finish', async (file) => {
      const newFile = new File({
        filename: file.filename,
        contentType: file.contentType,
        length: file.length,
        owner: req.user.userId
      });

      await newFile.save();
      res.status(201).json(newFile);
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List files
router.get('/list', verifyToken, async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.userId });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download file
router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.owner.toString() !== req.user.userId && !file.isPublic) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const readStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(req.params.id));
    
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    
    readStream.pipe(res);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete file
router.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await gfs.delete(new mongoose.Types.ObjectId(req.params.id));
    await File.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;