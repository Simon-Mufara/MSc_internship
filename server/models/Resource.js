const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lectures', 'recordings', 'materials'],
    required: true
  },
  size: Number, // in bytes
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mimeType: String,
  fileData: String, // Base64 encoded file data
  url: String, // For external storage (optional)
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
