// const mongoose = require('mongoose');
// const { GridFSBucket } = require('mongodb');

// // File schema for metadata
// const fileSchema = new mongoose.Schema({
//   filename: {
//     type: String,
//     required: true
//   },
//   contentType: {
//     type: String,
//     required: true
//   },
//   length: {
//     type: Number,
//     required: true
//   },
//   uploadDate: {
//     type: Date,
//     default: Date.now
//   },
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user',
//     required: true
//   },
//   parentFolder: {
//     type: String,
//     default: 'root'
//   },
//   isPublic: {
//     type: Boolean,
//     default: false
//   }
// });

// // Create GridFS bucket
// let gfs;
// mongoose.connection.once('open', () => {
//   gfs = new GridFSBucket(mongoose.connection.db, {
//     bucketName: 'uploads'
//   });
// });

// const File = mongoose.model('File', fileSchema);

// module.exports = { File, gfs };


const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  length: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentFolder: {
    type: String,
    default: 'root'
  },
  isPublic: {
    type: Boolean,
    default: false
  }
});

// Create GridFS bucket
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

module.exports = {
  File: mongoose.model('File', fileSchema),
  gfs
};