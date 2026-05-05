const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  monthlyUpdate: String,
  pty6027Progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pty6028Progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  supervisorFeedback: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdated on save
progressSchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('Progress', progressSchema);
