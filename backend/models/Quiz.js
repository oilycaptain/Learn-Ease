const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  // ADD THIS FIELD
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank'],
    default: 'multiple-choice'
  }
});

const quizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  sourceFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  timeLimit: {
    type: Number, // in minutes
    default: 10
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  quizType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'fill-blank', 'hybrid'],
    default: 'multiple-choice'
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);