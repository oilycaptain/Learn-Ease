// src/pages/LivesChallenge.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const LivesChallenge = ({ fileId: propFileId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const fileId = location.state?.fileId || propFileId;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lives, setLives] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Fetch quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!fileId) {
        alert("No study material selected!");
        setLoading(false);
        return;
      }

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
            body: JSON.stringify({ numQuestions: 5 }),
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
  }, [fileId]);

  const handleAnswer = (index, value) => {
    if (submitted || gameOver) return;

    const correct =
      value.trim().toLowerCase() ===
      questions[index].answer.trim().toLowerCase();

    if (correct) {
      setScore((s) => s + 1);
      setFeedback("✅ Correct!");
    } else {
      setLives((l) => l - 1);
      setFeedback("❌ Wrong!");
    }

    setAnswers((prev) => ({ ...prev, [index]: value }));

    // Delay before moving to next question
    setTimeout(() => {
      setFeedback("");
      if (index < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setSubmitted(true);
      }
    }, 1000);
  };

  // End game when out of lives
  useEffect(() => {
    if (lives <= 0) setGameOver(true);
  }, [lives]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold text-gray-700">
        ⚡ Loading your challenge...
      </div>
    );

  if (gameOver)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-red-100 to-orange-100 text-center p-6">
        <h1 className="text-5xl font-extrabold text-red-600 mb-4 animate-pulse">
          💀 Game Over!
        </h1>
        <p className="text-lg text-gray-700 mb-2">You lost all your lives.</p>
        <p className="text-xl font-semibold text-gray-900 mb-6">
          Final Score: {score} / {questions.length}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition shadow-lg"
        >
          🔁 Try Again
        </button>
      </div>
    );

  if (submitted)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-100 to-emerald-100 text-center p-6">
        <h1 className="text-5xl font-extrabold text-green-600 mb-4 animate-bounce">
          🎉 Challenge Complete!
        </h1>
        <p className="text-lg text-gray-700 mb-2">
          You survived all the questions!
        </p>
        <p className="text-xl font-semibold text-gray-900 mb-6">
          Score: {score} / {questions.length}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-lg"
        >
          🔁 Play Again
        </button>
      </div>
    );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-100 flex items-center justify-center px-4 py-10">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/40"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            ❤️ Lives Challenge
          </h1>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  scale: i < lives ? 1.1 : 1,
                  opacity: i < lives ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
                className="text-2xl"
              >
                ❤️
              </motion.span>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          ></div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {currentIndex + 1}. {q.question}
        </h3>

        {q.type === "Multiple Choice" ? (
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(currentIndex, opt)}
                className={`w-full text-left p-3 border-2 rounded-lg transition-all duration-200 ${
                  answers[currentIndex] === opt
                    ? opt.trim().toLowerCase() ===
                      q.answer.trim().toLowerCase()
                      ? "bg-green-100 border-green-500"
                      : "bg-red-100 border-red-400"
                    : "hover:bg-gray-50 border-gray-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              className="w-full border-2 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Your answer..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnswer(currentIndex, e.target.value);
              }}
            />
            <button
              onClick={() =>
                handleAnswer(
                  currentIndex,
                  document.querySelector("input").value
                )
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit Answer
            </button>
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.p
              key={feedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center text-lg font-semibold"
            >
              {feedback}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-6 text-right text-gray-600 font-medium">
          Question {currentIndex + 1} / {questions.length}
        </div>
      </motion.div>
    </div>
  );
};

export default LivesChallenge;
