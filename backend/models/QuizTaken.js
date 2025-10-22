const mongoose = require('mongoose');

const quizTakenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Make sure you have a User model
    required: true
  },
  quizTitle: {
    type: String,
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz', // Optional, if you have a Quiz collection
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  takenAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizTaken', quizTakenSchema);
