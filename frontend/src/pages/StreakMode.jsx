// src/pages/StreakMode.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const StreakMode = ({ fileId: propFileId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const fileId = location.state?.fileId || propFileId;

  // --- Setup and quiz states ---
  const [setupDone, setSetupDone] = useState(false);
  const [userSelectedNumber, setUserSelectedNumber] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState("");
  const [quizEnded, setQuizEnded] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // --- Start Quiz ---
  const startQuiz = async () => {
    if (!fileId) {
      alert("No study material selected!");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/quiz/generate-from-file/${fileId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ numQuestions: userSelectedNumber }),
        }
      );

      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      setSetupDone(true);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      alert("Failed to fetch quiz.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Answer ---
  const handleAnswer = (index, value) => {
    if (!value.trim()) return;
    setSelected(value);
    const q = questions[index];
    const correct =
      value.trim().toLowerCase() === q.answer.trim().toLowerCase();

    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      setFeedback("✅ Correct!");
    } else {
      setStreak(0);
      setFeedback("❌ Wrong! Streak reset!");
    }

    setTimeout(() => {
      setFeedback("");
      setSelected("");
      if (index < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        handleEndQuiz();
      }
    }, 1000);
  };

  // --- End or Quit Quiz ---
  const handleEndQuiz = () => setQuizEnded(true);
  const handleRestart = () => window.location.reload();

  // --- ENTER key submit handler ---
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Enter" && !showQuitModal && !quizEnded && setupDone) {
        const q = questions[currentIndex];
        if (q.type !== "Multiple Choice") {
          const input = document.querySelector("#streak-answer-input");
          if (input && input.value.trim()) {
            handleAnswer(currentIndex, input.value);
          }
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [questions, currentIndex, showQuitModal, quizEnded, setupDone]);

  // --- Setup Screen ---
  if (!setupDone) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-orange-100 to-yellow-100 text-center">
        <h1 className="text-3xl font-bold text-orange-700 mb-6">🔥 Streak Mode Setup</h1>
        <div className="bg-white shadow-lg p-8 rounded-2xl w-80">
          <label className="block mb-3 text-gray-700 font-semibold">
            Number of Questions:
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={userSelectedNumber}
            onChange={(e) => setUserSelectedNumber(Number(e.target.value))}
            className="border-2 border-orange-300 rounded-lg p-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={startQuiz}
            disabled={loading}
            className="mt-5 w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition"
          >
            {loading ? "Loading..." : "Start Quiz 🔥"}
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-lg font-semibold text-orange-600">
        🔥 Loading Streak Challenge...
      </div>
    );

  // --- End Screen ---
  if (quizEnded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-orange-100 to-yellow-100">
        <h2 className="text-3xl font-bold text-orange-700 mb-4">🏁 Streak Mode Finished!</h2>
        <p className="text-lg text-gray-700 mb-2">
          Best Streak: <span className="font-bold text-orange-600">{bestStreak}</span>
        </p>
        <p className="text-gray-600 mb-6">Total Questions: {questions.length}</p>
        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            🔁 Restart
          </button>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition"
          >
            ⬅ Back
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  // --- Main Quiz UI ---
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 flex items-center justify-center px-4 py-10">
      {/* Top-Right Quit Button */}
      <button
        onClick={() => setShowQuitModal(true)}
        className="absolute top-5 right-5 bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
      >
        🚪 Quit
      </button>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-orange-200"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-700 flex items-center gap-2">
            🔥 Streak Mode
          </h1>
          <div className="flex flex-col items-end">
            <motion.p
              key={streak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`font-bold text-2xl ${
                streak > 0 ? "text-orange-600 drop-shadow-md" : "text-gray-700"
              }`}
            >
              {streak} 🔥
            </motion.p>
            <p className="text-gray-500 text-sm">
              Best: <span className="font-semibold text-orange-500">{bestStreak}</span>
            </p>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="p-5 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 shadow-sm mb-6"
        >
          <h3 className="font-semibold text-gray-800 text-lg mb-4">
            {currentIndex + 1}. {q.question}
          </h3>

          {q.type === "Multiple Choice" ? (
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const isCorrect = opt === q.answer;
                const isSelected = selected === opt;
                return (
                  <button
                    key={idx}
                    disabled={!!selected}
                    onClick={() => handleAnswer(currentIndex, opt)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      !selected
                        ? "border-gray-200 hover:border-orange-400 hover:bg-orange-50"
                        : isSelected
                        ? isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : "opacity-70"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              id="streak-answer-input"
              type="text"
              className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Type your answer and press Enter..."
            />
          )}
        </motion.div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`text-center text-lg font-semibold mt-2 ${
                feedback.includes("Correct") ? "text-green-600" : "text-red-600"
              }`}
            >
              {feedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-gray-600 font-medium text-center mt-6">
          Question {currentIndex + 1} / {questions.length}
        </div>
      </motion.div>

      {/* --- Quit Confirmation Modal --- */}
      <AnimatePresence>
        {showQuitModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-80 text-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Quit Challenge?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to end your streak challenge?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleEndQuiz}
                  className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Yes, Quit
                </button>
                <button
                  onClick={() => setShowQuitModal(false)}
                  className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StreakMode;
