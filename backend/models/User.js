
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    type: String
  },
  chatState: {
    type: String,
    enum: ['idle', 'awaiting_menu_selection'],
    default: 'idle'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
