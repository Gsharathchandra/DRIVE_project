const mongoose = require('mongoose');

// Define the file schema for storing file metadata
const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create and export the File model
const File = mongoose.model('File', fileSchema);
module.exports = File;