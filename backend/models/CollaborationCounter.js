const mongoose = require('mongoose');

const collaborationCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence_value: {
    type: Number,
    default: 0
  }
});

const CollaborationCounter = mongoose.model('CollaborationCounter', collaborationCounterSchema);

module.exports = CollaborationCounter;
