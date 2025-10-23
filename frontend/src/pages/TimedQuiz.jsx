// src/pages/TimedQuiz.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const TimedQuiz = ({ fileId: propFileId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const fileId = location.state?.fileId || propFileId;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Per-question 20s timer
  useEffect(() => {
    if (loading || submitted) return;
    if (timeLeft <= 0) {
      handleNextAuto();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, submitted]);

  // Move to next question automatically when time runs out
  const handleNextAuto = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setTimeLeft(20); // reset timer
    } else {
      handleSubmit();
    }
  };

  const handleAnswer = (index, value) => {
    if (!submitted) setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleNext = () => {
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

  const handleSubmit = () => {
    let scoreCount = 0;
    questions.forEach((q, i) => {
      if (answers[i]?.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
        scoreCount++;
      }
    });
    setScore(scoreCount);
    setSubmitted(true);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-lg font-semibold text-gray-600">
        ⏳ Generating quiz...
      </div>
    );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/40 transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🧠 Timed Quiz</h1>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600 font-medium">
              Time Left
            </span>
            <span
              className={`font-bold text-lg ${
                timeLeft < 6 ? "text-red-500" : "text-blue-600"
              }`}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Main Content */}
        {!submitted ? (
          <>
            {questions.length > 0 ? (
              <div
                key={currentIndex}
                className="transition-all duration-300"
              >
                <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    {currentIndex + 1}. {questions[currentIndex].question}
                  </h3>

                  {questions[currentIndex].type === "Multiple Choice" ? (
                    <div className="space-y-2">
                      {questions[currentIndex].options.map((opt, idx) => (
                        <label
                          key={idx}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
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
                      className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      value={answers[currentIndex] || ""}
                      onChange={(e) =>
                        handleAnswer(currentIndex, e.target.value)
                      }
                      placeholder="Your answer..."
                    />
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`px-5 py-2 rounded-lg font-semibold transition ${
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
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                      Submit Quiz
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p>No questions available.</p>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎉 Quiz Completed!
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              Score: <span className="font-bold text-blue-600">{score}</span> /{" "}
              {questions.length}
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Accuracy:{" "}
              <span className="font-bold text-green-600">
                {((score / questions.length) * 100).toFixed(1)}%
              </span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Retake Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimedQuiz;
