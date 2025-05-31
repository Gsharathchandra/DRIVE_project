const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/file.model');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = 'Uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp and random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow all file types
        cb(null, true);
    }
});

// Route to handle file uploads
router.post('/upload-file', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please select a file to upload'
            });
        }

        // Save file metadata to database
        const newFile = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            userId: req.user.userId,
            filePath: req.file.path,
            fileUrl: `/files/${req.file.filename}`
        });

        await newFile.save();

        // Redirect to main page with success parameter
        res.redirect('/home?upload=success');
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to upload file',
            error: error.message
        });
    }
});

// Route to retrieve user's files
router.get('/my-files', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user.userId })
            .sort({ uploadDate: -1 });
        
        res.json({
            success: true,
            files: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve files',
            error: error.message
        });
    }
});

// Route to download or view a file
router.get('/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const file = await File.findOne({ filename: filename });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        const filePath = path.join(__dirname, '../', file.filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not available on server'
            });
        }

        res.download(filePath, file.originalName);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to download file',
            error: error.message
        });
    }
});

// Route to delete a file
router.delete('/files/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ 
            _id: req.params.id, 
            userId: req.user.userId 
        });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Remove file from filesystem
        const filePath = path.join(__dirname, '../', file.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove file record from database
        await File.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to delete file',
            error: error.message
        });
    }
});

module.exports = router;