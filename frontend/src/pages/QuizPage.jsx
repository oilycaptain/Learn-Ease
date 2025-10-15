import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ErrorBoundary from '../components/ErrorBoundary';
import QuestionRenderer from '../components/QuestionRenderer';

const QuizPage = () => {

  // Build a display-friendly question text according to its type.
  const coerceDisplayForType = (q) => {
    const type = (q?.type || '').toLowerCase();
    let text = (q?.question || '').toString().trim();
    const ans = (q?.correctAnswer || '').toString().trim();

    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const stripQ = (s) => s.replace(/\?\s*$/, '').trim();

    // Resolve correct answer TEXT (handles letters A-D to option text)
    const letters = ['A','B','C','D'];
    const rawAns = (q?.correctAnswer || '').toString().trim();
    const matchLetter = rawAns.match(/^[A-D](?:[.)]|$)/i);
    let ansText = rawAns;
    if (matchLetter && Array.isArray(q?.options) && q.options.length) {
      const idx = letters.indexOf(rawAns[0].toUpperCase());
      if (idx >= 0 && q.options[idx] != null) ansText = q.options[idx].toString().trim();
    }

    if (type === 'true-false') {
      const t = text.toLowerCase();
      // Common patterns
      // 1) "Which of the following is/are X?"
      let m = t.match(/^(which|what)\s+of\s+the\s+following\s+(is|are)\s+(.+)\?$/i);
      if (m && ans) {
        return `True or False: ${ansText} ${m[2]} ${m[3]}.`;
      }
      // 2) "Which ... example of Y?"
      m = t.match(/^which\s+.*example\s+of\s+(.+)\?$/i);
      if (m && ans) {
        return `True or False: ${cap(ans)} is an example of ${m[1]}.`;
      }
      // 3) "What is/are X?"
      m = t.match(/^what\s+(is|are)\s+(.+)\?$/i);
      if (m && ans) {
        return `True or False: ${cap(m[2])} ${m[1]} ${ansText}.`;
      }
      // 4) "What does X ... ?"
      m = t.match(/^what\s+does\s+(.+)\?$/i);
      if (m && ans) {
        return `True or False: ${cap(m[1])} ${ansText}.`;
      }
      // Fallback: prefix True/False and drop the question mark
      return `True or False: ${stripQ(text)}.`;
    }

    if (type === 'fill-blank' || type === 'identification') {
      // If no blank present, transform into a cloze
      if (!/_{3,}/.test(text)) {
        // Pattern: Which of the following is/are X?
        const m = text.match(/^(Which|What)\s+of\s+the\s+following\s+(is|are)\s+(.+)\?$/i);
        if (m) return `____ ${m[2].toLowerCase()} ${m[3]}.`;
        // Otherwise, remove question mark and add a trailing blank
        text = stripQ(text);
        if (!/____/.test(text)) text = `${text} ____`;
        if (!/[.?!]$/.test(text)) text += '.';
        return text;
      }
      return text;
    }

    // Default (MCQ): return as-is
    return text;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    loadQuiz();
    const timer = setInterval(() => {
      if (quizStarted && !quizCompleted) {
        setTimeSpent(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted]);

  const loadQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${id}`);
      const qz = response.data;
      setQuiz(qz);
      const count = Array.isArray(qz?.questions) ? qz.questions.length : 0;
      setAnswers(Array.from({ length: count }, () => ({ selectedAnswer: '', timeSpent: 0 })));
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Quiz not found');
      navigate('/quizzes');
    }
  };

  const startQuiz = () => setQuizStarted(true);
  const endQuizEarly = () => setShowEndConfirm(true);
  const cancelEndQuiz = () => setShowEndConfirm(false);
  const confirmEndQuiz = () => { setShowEndConfirm(false); submitQuiz(); };

  const handleAnswer = (answer) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQuestion] = {
        selectedAnswer: answer,
        timeSpent: next[currentQuestion]?.timeSpent || 0,
      };
      return next;
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const submitQuiz = async () => {
    try {
      const total = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
      const normalizedAnswers = Array.from({ length: total }, (_, i) => answers[i] || { selectedAnswer: '', timeSpent: 0 });
      const response = await api.post(`/quizzes/${id}/attempt`, {
        answers: normalizedAnswers,
        timeSpent
      });
      setResults(response.data);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    }
  };

  if (!quiz) return <div className="p-6">Loading...</div>;

  if (!quizStarted) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
            <div className="space-y-3 text-gray-600 mb-6">
              <p>📚 Subject: {quiz.subject}</p>
              <p>❓ Questions: {quiz.questions?.length || 0}</p>
              <p>⏱️ Time Limit: {quiz.timeLimit} minutes</p>
              <p>🎯 Difficulty: 
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quiz.difficulty}
                </span>
              </p>
              <p>📝 Type: 
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {quiz.quizType}
                </span>
              </p>
              {quiz.sourceFile && <p>📄 Source: {quiz.sourceFile.originalName || quiz.sourceFile}</p>}
            </div>
            <button
              onClick={startQuiz}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-lg font-semibold"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (quizCompleted && results) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <div className={`text-6xl font-bold mb-4 ${
                results.score >= 80 ? 'text-green-500' : 
                results.score >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {results.score}%
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h1>
              <p className="text-gray-600">
                You got {results.correctCount} out of {results.totalQuestions} questions correct
              </p>
              <p className="text-gray-600">Time: {formatTime(timeSpent)}</p>
            </div>

            <div className="space-y-4">
              {results.questions.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {index + 1}. {q.question}
                  </h3>
                  <div className={`p-3 rounded ${
                    results.answers[index].isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm">
                      <strong>Your answer:</strong> {results.answers[index].selectedAnswer || 'Not answered'} • 
                      <strong> Correct answer:</strong> {q.correctAnswer}
                    </p>
                    {q.explanation && (
                      <p className="text-sm text-gray-600 mt-2">{q.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/quizzes')}
              className="w-full mt-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Guard for empty or out-of-range
  const total = Array.isArray(quiz?.questions) ? quiz.questions.length : 0;
  if (!total) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 border">
            <h1 className="text-xl font-semibold">No questions found</h1>
            <p className="text-gray-600 mt-2">
              This quiz has no questions yet. Try regenerating it.
            </p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }
  const safeIndex = Math.min(Math.max(0, currentQuestion), total - 1);
const question = quiz.questions[safeIndex] || {};
// Force type from quiz.quizType if missing to avoid defaulting to MCQ
const forcedType = quiz?.quizType || question?.type || 'multiple-choice';
const effectiveQuestion = {
  ...question,
  type: forcedType,
  options: Array.isArray(question?.options) ? question.options : []
};


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* End Quiz Confirmation Modal */}
        {showEndConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">End Quiz?</h3>
              <p className="text-gray-600 mb-4">
                You have completed {safeIndex + 1} out of {total} questions. 
                Are you sure you want to end the quiz early?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelEndQuiz}
                  className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Continue Quiz
                </button>
                <button
                  onClick={confirmEndQuiz}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  End Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          {/* Progress and Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-600">
              Question {safeIndex + 1} of {total}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Time: {formatTime(timeSpent)}
              </div>
              <button
                onClick={endQuizEarly}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
              >
                End Quiz
              </button>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((safeIndex + 1) / total) * 100}%` }}
            ></div>
          </div>

          {/* Question */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{coerceDisplayForType(effectiveQuestion)}</h2>
          {effectiveQuestion.type !== 'multiple-choice' && (
            <span className="inline-block mb-4 text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {effectiveQuestion.type === 'true-false' ? 'True/False' : 'Fill in Blank'}
            </span>
          )}

          {/* Question UI by type */}
          <div className="mb-6">
            <QuestionRenderer
              question={effectiveQuestion}
              value={answers[safeIndex]?.selectedAnswer || ''}
              onChange={handleAnswer}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, safeIndex - 1))}
              disabled={safeIndex === 0}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            
            <button
              onClick={() => (safeIndex < total - 1 ? setCurrentQuestion(safeIndex + 1) : submitQuiz())}
              disabled={!answers[safeIndex] || answers[safeIndex].selectedAnswer === undefined}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {safeIndex === total - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default QuizPage;
