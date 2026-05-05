const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['assessment', 'deadline', 'work', 'class'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'student', 'conveyor', 'supervisor', 'all'],
    default: 'all'
  },
  reminder: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: Number,
    default: 24 // hours before event
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', eventSchema);
