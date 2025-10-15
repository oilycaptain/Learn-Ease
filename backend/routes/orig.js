// routes/quizzes.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { Ollama } = require('ollama');

const Quiz = require('../models/orig');
const QuizAttempt = require('../models/QuizAttempt');
const File = require('../models/File');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const ollama = new Ollama({ host: 'http://localhost:11434' });

/* ----------------------------- helpers ----------------------------- */

async function extractPlainText(absPath, fileTypeHint) {
  const ext = (path.extname(absPath) || '').toLowerCase();
  const type = (fileTypeHint || '').toLowerCase();

  // TXT
  if (ext === '.txt' || type === 'txt') {
    return fs.readFileSync(absPath, 'utf8');
  }

  // DOCX
  if (ext === '.docx' || type === 'docx' || type === 'doc') {
    try {
      const { value } = await mammoth.extractRawText({ path: absPath });
      return (value || '').trim();
    } catch (e) {
      console.error('DOCX extract error:', e.message);
      return '';
    }
  }

  // PDF - Improved extraction
  if (ext === '.pdf' || type === 'pdf') {
    try {
      const dataBuffer = fs.readFileSync(absPath);
      const out = await pdf(dataBuffer);
      let txt = (out.text || '').trim();
      
      // If little text was extracted, try alternative method
      if (txt.length < 100) {
        console.log('PDF extracted minimal text, trying raw data analysis...');
        // Sometimes pdf-parse misses text, try reading raw data
        const rawText = dataBuffer.toString('utf8');
        // Extract text between text operators in PDF stream
        const textMatches = rawText.match(/\(([^)]+)\)/g);
        if (textMatches) {
          const additionalText = textMatches.map(match => 
            match.slice(1, -1) // Remove parentheses
          ).join(' ');
          txt += ' ' + additionalText;
        }
      }
      
      return txt.trim();
    } catch (e) {
      console.error('PDF extract error:', e.message);
      return '';
    }
  }

  // Fallback: try reading as UTF-8 text
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return '';
  }
}

/** Clean / coerce model output to valid JSON */
function parseModelJson(raw) {
  if (!raw) throw new Error('empty_model_output');
  let s = raw.trim();
  if (s.startsWith('```')) {
    // strip code fences
    s = s.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/,'').trim();
  }
  return JSON.parse(s);
}

/** Ensure quiz object has the right structure; repair common issues */
// Update the normalizeQuiz function to handle different question types
function normalizeQuiz(quizData, quizType = 'multiple-choice') {
  if (!quizData || typeof quizData !== 'object') {
    throw new Error('invalid_quiz_json');
  }
  if (!Array.isArray(quizData.questions)) throw new Error('no_questions');

  let title = quizData.quizTitle || quizData.title || 'Generated Quiz';
  const normQs = [];

  for (let i = 0; i < quizData.questions.length; i++) {
    const q = quizData.questions[i] || {};
    let question = String(q.question || q.prompt || q.stem || '').trim();

    // Handle different question types
    let options = [];
    let correctAnswer = '';
    let explanation = q.explanation ? String(q.explanation) : '';

    switch (quizType) {
      case 'true-false':
        options = ['True', 'False', 'Not specified in notes', 'Partially true'];
        correctAnswer = (q.correctAnswer || q.answer || 'True').toString().trim();
        // Normalize true/false answers
        if (correctAnswer.toLowerCase() === 'true' || correctAnswer === 'T') correctAnswer = 'True';
        if (correctAnswer.toLowerCase() === 'false' || correctAnswer === 'F') correctAnswer = 'False';
        break;

      case 'fill-blank':
        // For fill-blank, we'll present it as multiple choice with plausible options
        options = Array.isArray(q.options) ? q.options.map(o => String(o)) : [];
        if (options.length < 4) {
          // Generate plausible distractors if not enough options
          const baseAnswer = q.correctAnswer || q.answer || '';
          while (options.length < 4) {
            options.push(`Option ${options.length + 1}`);
          }
        }
        correctAnswer = (q.correctAnswer || q.answer || options[0] || '').toString().trim();
        break;

      case 'multiple-choice':
      default:
        options = Array.isArray(q.options) ? q.options.map(o => String(o)) : [];
        if (options.length < 4 && Array.isArray(q.choices)) {
          options = q.choices.map(o => String(o));
        }
        // pad/truncate to 4
        while (options.length < 4) options.push('—');
        if (options.length > 4) options = options.slice(0, 4);

        // Correct answer handling for multiple choice
        let correct = (q.correctAnswer || q.answer || '').toString().trim();
        const letterFromIndex = (idx) => ['A','B','C','D'][idx] || 'A';
        const indexFromLetter = (c) => {
          const up = (c || '').toString().trim().toUpperCase();
          if (['A','B','C','D'].includes(up)) return ['A','B','C','D'].indexOf(up);
          return -1;
        };

        let answerLetter = 'A';
        const idxFromLetter = indexFromLetter(correct);
        if (idxFromLetter !== -1) {
          answerLetter = correct.toUpperCase();
        } else if (correct) {
          const norm = (s) => s.toString().trim().toLowerCase();
          const target = norm(correct);
          let hit = options.findIndex(o => norm(o) === target);
          if (hit === -1) {
            hit = options.findIndex(o => norm(o).includes(target) || target.includes(norm(o)));
          }
          answerLetter = letterFromIndex(hit === -1 ? 0 : hit);
        }
        correctAnswer = answerLetter;
        break;
    }

    // If the model failed to produce a real question, skip it
    if (!question || question.length < 5) continue;

    normQs.push({
      question,
      options,
      correctAnswer,
      explanation,
      type: quizType // Store the question type
    });
  }

  const filtered = normQs.filter(q =>
    q.question && Array.isArray(q.options) && q.options.length === 4
  );

  if (!filtered.length) throw new Error('no_valid_questions');

  return {
    quizTitle: title,
    questions: filtered
  };
}

/** Build fallback ONLY from content (never filename/meta) */
function createContentBasedFallbackQuiz(content, questionCount) {
  // Extract meaningful sentences from content
  const sentences = String(content)
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200) // Reasonable length
    .slice(0, questionCount * 3); // Get more than needed

  const questions = [];

  for (let i = 0; i < Math.min(sentences.length, questionCount); i++) {
    const sentence = sentences[i];
    if (!sentence) continue;

    // Create better questions based on actual content
    const words = sentence.split(/\s+/).filter(w => w.length > 3);
    const keyTerm = words[Math.floor(Math.random() * words.length)] || 'content';

    questions.push({
      question: `Based on the notes, what is the most accurate statement about "${keyTerm}"?`,
      options: [
        `It aligns with the information provided about ${keyTerm}`,
        `It contradicts the notes regarding ${keyTerm}`,
        `It represents incomplete information about ${keyTerm}`,
        `It is not addressed in the notes`
      ],
      correctAnswer: "A",
      explanation: `The correct answer is supported by the content in the study materials.`
    });
  }

  // Fill remaining slots with content-based questions
  while (questions.length < questionCount) {
    const contentSnippet = content.slice(0, 100).replace(/\s+/g, ' ');
    questions.push({
      question: `Which statement best reflects the information in the study materials?`,
      options: [
        "The information is consistent with the provided notes",
        "The information contradicts the main points",
        "The information is only partially accurate",
        "The information is not covered in the notes"
      ],
      correctAnswer: "A",
      explanation: "The first option accurately represents the content from the study materials."
    });
  }

  return {
    quizTitle: "Study Materials Quiz",
    questions
  };
}

/* ------------------------------ routes ------------------------------ */

// Get all quizzes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('sourceFile', 'originalName');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quizzes', error: error.message });
  }
});

// Get quiz attempts for user
router.get('/attempts', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .populate('quiz', 'title subject')
      .sort({ completedAt: -1 })
      .limit(10);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attempts', error: error.message });
  }
});

// Generate quiz from file using ACTUAL extracted content
// Add these new routes to your quizzes.js
// Add this new route for hybrid quizzes
router.post('/generate-hybrid-from-file/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { 
      questionCount = 5,
      questionMix = { 'multiple-choice': 60, 'true-false': 20, 'fill-blank': 20 },
      model = 'qwen2.5:1.5b',
      difficulty = 'medium',
      timeLimit = 10
    } = req.body;

    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const absPath = path.join(uploadsRoot, file.filename);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'Stored file missing on disk' });
    }

    // Extract text
    let notes = await extractPlainText(absPath, file.fileType);
    const charCount = (notes || '').replace(/\s+/g, ' ').length;
    
    if (charCount < 500) {
      return res.status(415).json({
        message: 'We could not extract enough text from your file.'
      });
    }

    const MAX_CHARS = 12000;
    const context = notes.slice(0, MAX_CHARS);

    // Calculate number of questions per type
    const totalQuestions = questionCount;
    const mcCount = Math.round(totalQuestions * (questionMix['multiple-choice'] / 100));
    const tfCount = Math.round(totalQuestions * (questionMix['true-false'] / 100));
    const fbCount = totalQuestions - mcCount - tfCount;

    const system = 'You are an expert quiz generator. Create high-quality questions based on the provided content.';
    
    const user = `
NOTES:
"""
${context}
"""

TASK:
Create a hybrid quiz with:
- ${mcCount} multiple-choice questions
- ${tfCount} true/false questions  
- ${fbCount} fill-in-the-blank questions (presented as multiple choice with plausible options)

RULES FOR EACH TYPE:

MULTIPLE-CHOICE:
- Clear stems with 4 distinct options
- One clearly correct answer
- Options should be plausible but only one correct

TRUE/FALSE:
- Clear statements that can be definitively judged as true or false based on notes
- Use actual true/false statements, not opinions
- Focus on factual content from notes

FILL-IN-BLANK:
- Sentences with key terms/phrases missing
- Provide the correct answer and 3 plausible distractors
- Blanks should test important concepts from notes

ALL QUESTIONS:
- Use ONLY information from NOTES
- Questions must be clear and unambiguous
- Provide brief explanations
- Vary question styles and cognitive levels

STRICT JSON FORMAT:
{
  "quizTitle": "Hybrid Quiz from Notes",
  "questions": [
    {
      "type": "multiple-choice",
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "brief explanation"
    },
    {
      "type": "true-false", 
      "question": "statement that is true or false",
      "options": ["True", "False", "Not specified", "Partially true"],
      "correctAnswer": "True",
      "explanation": "brief explanation"
    },
    {
      "type": "fill-blank",
      "question": "The process of ______ is essential for...",
      "options": ["photosynthesis", "respiration", "digestion", "circulation"],
      "correctAnswer": "photosynthesis", 
      "explanation": "brief explanation"
    }
  ]
}
`.trim();

    const response = await ollama.chat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      stream: false,
      options: { temperature: 0.5 }
    });

    let quizJson;
    try {
      quizJson = parseModelJson(response?.message?.content || '');
      
      // Normalize each question according to its type
      const normalizedQuestions = quizJson.questions.map(q => {
        const normalized = normalizeQuiz({ questions: [q] }, q.type || 'multiple-choice');
        return normalized.questions[0];
      });
      
      quizJson.questions = normalizedQuestions;
    } catch (e) {
      console.warn('Hybrid quiz generation failed:', e.message);
      // Fallback to regular quiz
      quizJson = createContentBasedFallbackQuiz(context, totalQuestions);
    }

    const quiz = new Quiz({
      user: req.user._id,
      title: `Hybrid: ${file.originalName}`,
      subject: file.subject || 'General',
      questions: quizJson.questions,
      sourceFile: fileId,
      totalQuestions: quizJson.questions.length,
      timeLimit: timeLimit,
      difficulty: difficulty,
      quizType: 'hybrid'
    });

    await quiz.save();
    res.json({ message: 'Hybrid quiz generated!', quiz });

  } catch (error) {
    console.error('Hybrid quiz generation error:', error);
    res.status(500).json({ message: 'Error generating hybrid quiz', error: error.message });
  }
});
// Enhanced quiz generation with customization
router.post('/generate-custom-from-file/:fileId', authMiddleware, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { 
      questionCount = 5, 
      model = 'qwen2.5:1.5b',
      difficulty = 'medium',
      quizType = 'multiple-choice',
      topics = [],
      timeLimit = 10
    } = req.body;

    const file = await File.findOne({ _id: fileId, user: req.user._id });
    if (!file) return res.status(404).json({ message: 'File not found' });

    const uploadsRoot = path.resolve(process.cwd(), 'uploads');
    const absPath = path.join(uploadsRoot, file.filename);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'Stored file missing on disk' });
    }

    // Extract text
    let notes = await extractPlainText(absPath, file.fileType);
    const charCount = (notes || '').replace(/\s+/g, ' ').length;
    
    if (charCount < 500) {
      return res.status(415).json({
        message: 'We could not extract enough text from your file.'
      });
    }

    const MAX_CHARS = 12000;
    const context = notes.slice(0, MAX_CHARS);

    // Enhanced prompt with customization
    const system = 'You are an expert quiz generator. Create high-quality questions based on the provided content.';
    
    const difficultyPrompts = {
      'easy': 'Create straightforward questions testing basic recall and understanding.',
      'medium': 'Create questions that require comprehension and application of concepts.',
      'hard': 'Create challenging questions that require analysis, evaluation, and critical thinking.'
    };

    const typePrompts = {
      'multiple-choice': 'multiple-choice questions with 4 options',
      'true-false': 'true/false questions',
      'fill-blank': 'fill-in-the-blank questions (format as multiple choice)'
    };

    const user = `
NOTES:
"""
${context}
"""

TASK:
Create ${questionCount} ${typePrompts[quizType] || 'multiple-choice questions'} at ${difficulty} difficulty level.
${topics.length > 0 ? `Focus on these topics: ${topics.join(', ')}.` : ''}

${difficultyPrompts[difficulty]}

RULES:
- Use ONLY information from NOTES
- Questions must be clear and unambiguous
- For multiple-choice: exactly 4 options (A-D)
- For true/false: options should be ["True", "False", "Not specified in notes", "Partially true"]
- Provide brief explanations
- Make questions progressively harder for "hard" difficulty

STRICT JSON FORMAT:
{
  "quizTitle": "Custom Quiz from Notes",
  "questions": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "brief explanation",
      "difficulty": "${difficulty}"
    }
  ]
}
`.trim();

    const response = await ollama.chat({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      stream: false,
      options: { temperature: difficulty === 'hard' ? 0.7 : 0.4 }
    });

    let quizJson;
    try {
      quizJson = parseModelJson(response?.message?.content || '');
      quizJson = normalizeQuiz(quizJson);
    } catch (e) {
      console.warn('Model JSON normalize failed:', e.message);
      quizJson = createContentBasedFallbackQuiz(context, questionCount);
    }

    const quiz = new Quiz({
      user: req.user._id,
      title: `Custom: ${file.originalName}`,
      subject: file.subject || 'General',
      questions: quizJson.questions,
      sourceFile: fileId,
      totalQuestions: quizJson.questions.length,
      timeLimit: timeLimit,
      difficulty: difficulty,
      quizType: quizType
    });

    await quiz.save();
    res.json({ message: 'Custom quiz generated!', quiz });

  } catch (error) {
    console.error('Custom quiz generation error:', error);
    res.status(500).json({ message: 'Error generating custom quiz', error: error.message });
  }
});

// Enhanced quick quiz with customization
router.post('/generate-custom-quick', authMiddleware, async (req, res) => {
  try {
    const { 
      subject, 
      questionCount = 5, 
      difficulty = 'medium',
      quizType = 'multiple-choice',
      timeLimit = 10,
      model = 'qwen2.5:1.5b' 
    } = req.body;
    
    if (!subject) return res.status(400).json({ message: 'Subject is required' });

    const difficultyText = {
      'easy': 'basic recall and fundamental concepts',
      'medium': 'comprehension and application',
      'hard': 'analysis, evaluation, and critical thinking'
    };

    const resp = await ollama.chat({
      model,
      messages: [{
        role: 'user',
        content: `
Create ${questionCount} ${quizType} questions about ${subject} at ${difficulty} difficulty level.
Focus on ${difficultyText[difficulty]}.

Requirements:
- Clear, unambiguous questions
- ${quizType === 'multiple-choice' ? 'Exactly 4 options (A-D)' : 'Appropriate options for the question type'}
- One clearly correct answer
- Brief explanation for each
- Vary question styles and cognitive levels

JSON Format:
{
  "quizTitle": "Custom ${subject} Quiz",
  "questions": [
    {
      "question": "question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "why A is correct",
      "difficulty": "${difficulty}"
    }
  ]
}
`.trim()
      }],
      stream: false,
      options: { temperature: difficulty === 'hard' ? 0.7 : 0.5 }
    });

    let quizJson;
    try {
      quizJson = parseModelJson(resp?.message?.content || '');
      quizJson = normalizeQuiz(quizJson);
    } catch (e) {
      const content = `Core concepts about ${subject} at ${difficulty} level.`;
      quizJson = createContentBasedFallbackQuiz(content, questionCount);
      quizJson.quizTitle = `Custom ${subject} Quiz`;
    }

    const quiz = new Quiz({
      user: req.user._id,
      title: quizJson.quizTitle,
      subject,
      questions: quizJson.questions,
      totalQuestions: quizJson.questions.length,
      timeLimit: timeLimit,
      difficulty: difficulty,
      quizType: quizType
    });

    await quiz.save();
    res.json({ message: 'Custom quiz created!', quiz });

  } catch (error) {
    res.status(500).json({ message: 'Error creating custom quiz', error: error.message });
  }
});
// Get specific quiz
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id })
      .populate('sourceFile', 'originalName');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quiz', error: error.message });
  }
});

// Submit quiz attempt
router.post('/:id/attempt', authMiddleware, async (req, res) => {
  try {
    const { answers = [], timeSpent = 0 } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    let correctCount = 0;
    const detailed = answers.map((a, idx) => {
      const sel = (a?.selectedAnswer || '').toString().toUpperCase();
      const correct = quiz.questions[idx]?.correctAnswer?.toString().toUpperCase();
      const isCorrect = ['A','B','C','D'].includes(sel) && sel === correct;
      if (isCorrect) correctCount++;
      return {
        questionIndex: idx,
        selectedAnswer: sel,
        isCorrect,
        timeSpent: a?.timeSpent || 0
      };
    });

    const total = quiz.questions.length || 1;
    const score = Math.round((correctCount / total) * 100);

    const attempt = new QuizAttempt({
      user: req.user._id,
      quiz: quiz._id,
      score,
      totalQuestions: total,
      answers: detailed,
      timeSpent
    });
    await attempt.save();

    // Update aggregate stats safely
    const prevAttempts = quiz.attempts || 0;
    const prevAvg = quiz.averageScore || 0;
    const newAttempts = prevAttempts + 1;
    const newAvg = Math.round(((prevAvg * prevAttempts) + score) / newAttempts);

    quiz.attempts = newAttempts;
    quiz.averageScore = newAvg;
    await quiz.save();

    res.json({
      score,
      correctCount,
      totalQuestions: total,
      answers: detailed,
      questions: quiz.questions.map(q => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || ''
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting quiz', error: error.message });
  }
});

// Delete quiz + attempts
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    await QuizAttempt.deleteMany({ quiz: req.params.id });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
});

module.exports = router;
