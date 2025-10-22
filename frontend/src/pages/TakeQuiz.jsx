import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const TakeQuiz = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const questions = state?.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);

  if (!questions.length) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">No quiz data found!</h2>
        <button onClick={() => navigate("/quizzes")} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  const handleAnswer = (answer) => {
    setUserAnswers((prev) => ({ ...prev, [currentIndex]: answer }));

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Quiz finished
      let correct = 0;
      questions.forEach((q, i) => {
        if (userAnswers[i] === q.answer || (i === currentIndex && answer === q.answer)) correct++;
      });
      setScore({ correct, total: questions.length });
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        {score ? (
          <>
            <h1 className="text-3xl font-bold mb-4">Quiz Finished!</h1>
            <p className="text-xl mb-6">You scored {score.correct} / {score.total}</p>
            <button onClick={() => navigate("/quizzes")} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Back to Menu</button>
          </>
        ) : (
          <>
            <h2 className="text-lg text-gray-500 mb-2">Question {currentIndex + 1} / {questions.length}</h2>
            <p className="text-2xl font-semibold mb-6">{currentQuestion.question}</p>
            <div className="space-y-4">
              {currentQuestion.options ? currentQuestion.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleAnswer(opt)} className="w-full p-3 border rounded-lg hover:bg-indigo-50 transition text-left">{opt}</button>
              )) : (
                <input
                  type="text"
                  placeholder="Type your answer"
                  value={userAnswers[currentIndex] || ""}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [currentIndex]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAnswer(userAnswers[currentIndex])}
                  className="w-full p-3 border rounded-lg"
                />
              )}
            </div>
            <div className="mt-6 text-center text-gray-400 text-sm">Answer to proceed to the next question</div>
          </>
        )}
      </div>
    </div>
  );
};

export default TakeQuiz;
