const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/file.model');
const authMiddleware = require('../middleware/auth');
const sanitizePath = require('sanitize-filename');

const uploadDir = 'Uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedName = sanitizePath(file.originalname.replace(extension, '')) + '-' + uniqueSuffix + extension;
    cb(null, sanitizedName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: JPEG, PNG, PDF, TXT, DOC, DOCX'));
    }
  },
});

router.post('/upload-file', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload',
      });
    }

    const newFile = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.user.userId,
      filePath: path.join('Uploads', req.file.filename),
      fileUrl: `/files/${req.file.filename}`,
    });

    await newFile.save();

    res.redirect('/home?upload=success');
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message.includes('Invalid file type') ? error.message : 'Unable to upload file',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
});

router.get('/my-files', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId }).sort({ uploadDate: -1 });
    res.json({
      success: true,
      files: files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve files',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
});

router.get('/files/:filename', async (req, res) => {
  try {
    const filename = sanitizePath(req.params.filename);
    const file = await File.findOne({ filename: filename });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    const filePath = path.join(__dirname, '../', file.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not available on server',
      });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to download file',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
});

router.delete('/files/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or you do not have permission to delete it',
      });
    }

    const filePath = path.join(__dirname, '../', file.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Unable to delete file',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
});

module.exports = router;