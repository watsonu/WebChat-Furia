const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Otimiza consultas por data
  }
});

module.exports = mongoose.model('Message', messageSchema);