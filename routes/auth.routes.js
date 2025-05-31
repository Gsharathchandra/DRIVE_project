// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const { File, gfs } = require('../models/file.model');
// const mongoose = require('mongoose');
// const { verifyToken } = require('../middleware/auth'); // You'll need to create this

// // Multer storage configuration for GridFS
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // Upload file
// router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     // Create a write stream to GridFS
//     const writeStream = gfs.openUploadStream(req.file.originalname, {
//       contentType: req.file.mimetype
//     });

//     writeStream.write(req.file.buffer);
//     writeStream.end();

//     writeStream.on('finish', async (file) => {
//       // Save file metadata
//       const newFile = new File({
//         filename: file.filename,
//         contentType: file.contentType,
//         length: file.length,
//         owner: req.user.userId, // From JWT
//         parentFolder: req.body.folder || 'root'
//       });

//       await newFile.save();
//       res.status(201).json(newFile);
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Download file
// router.get('/download/:id', verifyToken, async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ message: 'Invalid file ID' });
//     }

//     const file = await File.findById(req.params.id);
//     if (!file) {
//       return res.status(404).json({ message: 'File not found' });
//     }

//     // Check if user owns the file or if it's public
//     if (file.owner.toString() !== req.user.userId && !file.isPublic) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     const readStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(req.params.id));
    
//     // Set appropriate headers
//     res.set('Content-Type', file.contentType);
//     res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    
//     readStream.pipe(res);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // List files
// router.get('/list', verifyToken, async (req, res) => {
//   try {
//     const files = await File.find({ owner: req.user.userId });
//     res.json(files);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete file
// router.delete('/delete/:id', verifyToken, async (req, res) => {
//   try {
//     const file = await File.findById(req.params.id);
    
//     if (!file) {
//       return res.status(404).json({ message: 'File not found' });
//     }

//     if (file.owner.toString() !== req.user.userId) {
//       return res.status(403).json({ message: 'Unauthorized' });
//     }

//     await gfs.delete(new mongoose.Types.ObjectId(req.params.id));
//     await File.findByIdAndDelete(req.params.id);
    
//     res.json({ message: 'File deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registration
router.post(
  '/register',
  [
    body('email').trim().isEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, username, password } = req.body;
      const hashpassword = await bcrypt.hash(password, 10);
      
      const newUser = await User.create({
        email,
        username,
        password: hashpassword
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('password').trim().isLength({ min: 5 }),
    body('username').trim().isLength({ min: 3 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000
      });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;