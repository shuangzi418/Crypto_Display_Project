const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }
  ],
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: {
        type: Number,
        default: 0
      },
      completed: {
        type: Boolean,
        default: false
      }
    }
  ],
  status: {
    type: String,
    default: 'upcoming',
    enum: ['upcoming', 'active', 'ended']
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Competition', CompetitionSchema);