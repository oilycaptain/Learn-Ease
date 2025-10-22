import React, { useState, useEffect } from "react";

export default function QuizPage({ questionsData }) {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
      console.log("Loaded questions:", questionsData);
    }
  }, [questionsData]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generated Quiz</h1>

      {questions.length === 0 ? (
        <p className="text-gray-500">No questions available.</p>
      ) : (
        questions.map((q, i) => (
          <div
            key={i}
            className="quiz-question p-4 border rounded mb-4 bg-white shadow-sm"
          >
            <p className="font-semibold mb-2">
              Q{i + 1}: {q.question}
            </p>

            {q.type === "Multiple Choice" && q.options && (
              <ul className="list-disc ml-5 mb-2">
                {q.options.map((opt, j) => (
                  <li key={j}>{opt}</li>
                ))}
              </ul>
            )}

            {(q.type === "True or False" || q.type === "Identification") && (
              <p className="italic mb-2">Answer: {q.answer}</p>
            )}

            <p className="text-sm text-gray-400">Type: {q.type}</p>
          </div>
        ))
      )}
    </div>
  );
}
