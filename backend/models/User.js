const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);