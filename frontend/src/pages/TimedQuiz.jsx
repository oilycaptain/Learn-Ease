// src/pages/TimedQuiz.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";

const TimedQuiz = ({ fileId: propFileId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const fileId = location.state?.fileId || propFileId;
  const quizTypes = location.state?.quizTypes || [];

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  const correctSound = new Audio("/sounds/correct.mp3");
  const wrongSound = new Audio("/sounds/wrong.mp3");

  // Fetch quiz from backend
  useEffect(() => {
    if (!quizStarted || !fileId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:5000/api/quiz/generate-from-file/${fileId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ numQuestions, quizTypes }),
          }
        );

        const data = await response.json();
        if (data.questions) setQuestions(data.questions);
        else alert("Failed to generate quiz.");
      } catch (err) {
        console.error("Error fetching quiz:", err);
        alert("Error fetching quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizStarted, fileId, numQuestions]);

  // Timer logic
  useEffect(() => {
    if (loading || submitted || !quizStarted) return;
    if (timeLeft <= 0) {
      handleNextAuto();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, submitted, quizStarted]);

  const handleNextAuto = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(20);
    } else {
      handleSubmit();
    }
  };

  const handleAnswer = (index, value) => {
    if (!submitted) setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    const userAnswer = answers[currentIndex]?.trim().toLowerCase();
    const correctAnswer = currentQuestion?.answer?.trim().toLowerCase();

    if (userAnswer) {
      if (userAnswer === correctAnswer) {
        correctSound.currentTime = 0;
        correctSound.play().catch(() => {});
      } else {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(() => {});
      }
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(20);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setTimeLeft(20);
    }
  };

  // ✅ Submit & Save Quiz
  const handleSubmit = async () => {
    let scoreCount = 0;
    questions.forEach((q, i) => {
      if (answers[i]?.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        scoreCount++;
      }
    });

    setScore(scoreCount);
    setSubmitted(true);

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/quiz/submit",
        {
          quizId: fileId,
          quizTitle: `Quiz for ${fileId}`,
          score: scoreCount,
          totalQuestions: questions.length,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Quiz saved successfully!");
    } catch (err) {
      console.error("❌ Failed to save quiz:", err);
    }
  };

  // 🆕 Custom Quit Confirmation Modal
  const handleQuitConfirm = () => {
    setShowQuitModal(false);
    handleSubmit();
  };

  // Quiz setup screen
  if (!quizStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">🧠 Start Timed Quiz</h1>

        <label className="text-gray-700 font-medium mb-2">Number of Questions:</label>
        <input
          type="number"
          min="1"
          max="50"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          className="border p-3 rounded-lg text-center mb-6 w-32 text-lg font-semibold"
        />

        <button
          onClick={() => setQuizStarted(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-lg font-semibold text-gray-600">
        ⏳ Generating quiz...
      </div>
    );

  if (submitted)
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 Quiz Completed!</h2>
        <p className="text-lg text-gray-700 mb-2">
          Score: <span className="font-bold text-blue-600">{score}</span> / {questions.length}
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Accuracy:{" "}
          <span className="font-bold text-green-600">
            {((score / questions.length) * 100).toFixed(1)}%
          </span>
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          Finish 
        </button>
      </div>
    );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      {/* 🆕 Quit Quiz button */}
      <button
        onClick={() => setShowQuitModal(true)}
        className="absolute top-6 right-6 bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg"
      >
        ✖ Quit Quiz
      </button>

      <div className="w-full h-full flex flex-col items-center justify-between p-8">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-5xl">
          <h1 className="text-3xl font-bold text-gray-800">🧠 Timed Quiz</h1>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600 font-medium">Time Left</span>
            <span
              className={`font-bold text-lg ${
                timeLeft < 6 ? "text-red-500" : "text-blue-600"
              }`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Question Box */}
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/50 flex-1 flex flex-col justify-between mt-4 mb-6">
          {questions.length > 0 ? (
            <>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">
                  {currentIndex + 1}. {questions[currentIndex].question}
                </h3>

                {questions[currentIndex].type === "Multiple Choice" ? (
                  <div className="space-y-2">
                    {questions[currentIndex].options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                          answers[currentIndex] === opt
                            ? "bg-blue-100 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentIndex}`}
                          value={opt}
                          checked={answers[currentIndex] === opt}
                          onChange={() => handleAnswer(currentIndex, opt)}
                          className="accent-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={answers[currentIndex] || ""}
                    onChange={(e) => handleAnswer(currentIndex, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-6 items-center">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`px-6 py-3 rounded-lg font-semibold transition ${
                    currentIndex === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  ← Previous
                </button>

                {currentIndex === questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          ) : (
            <p>No questions available.</p>
          )}
        </div>
      </div>

      {/* 🆕 Quit Confirmation Modal */}
      <AnimatePresence>
        {showQuitModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 text-center shadow-xl max-w-sm w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Quit Quiz?
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to quit? Your current progress will be submitted.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuitConfirm}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Yes, Quit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimedQuiz;
