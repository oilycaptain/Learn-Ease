import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Import useLocation and useNavigate

// --- Icon Components ---
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-1">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-1">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// --- Main Component ---
export default function QuizPage() {
    // Get questions passed via state from navigation
    const location = useLocation();
    const navigate = useNavigate(); // For going back or retaking
    const questionsData = location.state?.questions || [];
    const quizTitle = location.state?.title || "Generated Quiz";

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // Store answers as { questionIndex: answer }
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (questionsData && questionsData.length > 0) {
            // Initialize questions and reset answers if data changes
            setQuestions(questionsData.map(q => ({ ...q, id: Math.random().toString(36).substring(2, 15) }))); // Add unique id for key prop if none exists
            setUserAnswers({});
            setCurrentQuestionIndex(0);
            setShowResults(false);
            setScore(0);
            console.log("Loaded questions:", questionsData);
        } else {
             console.log("No questions data received via location state.");
             setQuestions([]); // Set to empty array if no data
        }
    }, [questionsData]); // Rerun effect if questionsData changes

    const handleAnswerSelect = (questionIndex, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionIndex]: answer
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = () => {
        let calculatedScore = 0;
        questions.forEach((q, index) => {
            // Case-insensitive comparison for Identification
            if (q.type === "Identification") {
                 if (userAnswers[index]?.toLowerCase() === q.answer?.toLowerCase()) {
                    calculatedScore++;
                 }
            } else if (userAnswers[index] === q.answer) {
                calculatedScore++;
            }
        });
        setScore(calculatedScore);
        setShowResults(true);
    };

    const handleRetakeQuiz = () => {
         // Reset state to start the quiz again
         setUserAnswers({});
         setCurrentQuestionIndex(0);
         setShowResults(false);
         setScore(0);
    };

    const currentQuestion = questions[currentQuestionIndex];

    // --- Render Logic ---

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center p-6 bg-gray-50">
                <h1 className="text-2xl font-bold mb-4 text-gray-700">Generated Quiz</h1>
                <p className="text-gray-500 mb-6">No questions were generated or passed to this page.</p>
                 <button
                    onClick={() => navigate('/quizzes')} // Navigate back to quiz generation
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all"
                >
                    Generate New Quiz
                </button>
            </div>
        );
    }

    // --- Results View ---
    if (showResults) {
        return (
            <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-gray-50 min-h-screen">
                <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">{quizTitle} - Results</h1>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center mb-8">
                    <p className="text-xl font-semibold text-gray-700">Your Score:</p>
                    <p className="text-4xl font-bold text-indigo-600 my-2">
                        {score} / {questions.length}
                    </p>
                    <p className="text-gray-600">
                        ({((score / questions.length) * 100).toFixed(0)}%)
                    </p>
                </div>

                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Review Answers:</h2>
                {questions.map((q, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = q.type === "Identification"
                        ? userAnswer?.toLowerCase() === q.answer?.toLowerCase()
                        : userAnswer === q.answer;

                    return (
                        <div key={q.id || index} className="mb-6 bg-white p-5 rounded-lg shadow border border-gray-200">
                            <p className="font-semibold text-gray-800 mb-3">
                                Q{index + 1}: {q.question}
                            </p>
                            {q.type === "Multiple Choice" && q.options && (
                                <ul className="space-y-2 mb-3">
                                    {q.options.map((opt, j) => (
                                        <li key={j} className={`flex items-center p-2 rounded border ${
                                            opt === q.answer ? 'border-green-300 bg-green-50' : ''
                                        } ${opt === userAnswer && !isCorrect ? 'border-red-300 bg-red-50' : ''}`}
                                        >
                                            {opt === q.answer && <CheckIcon />}
                                            {opt === userAnswer && !isCorrect && <XIcon />}
                                            <span className={`ml-2 ${opt === q.answer ? 'font-semibold text-green-700' : ''} ${opt === userAnswer && !isCorrect ? 'text-red-700 line-through' : ''}`}>
                                                {opt}
                                            </span>
                                            {opt === userAnswer && isCorrect && <span className="ml-2 text-sm text-green-600">(Your answer)</span>}
                                            {opt === userAnswer && !isCorrect && <span className="ml-2 text-sm text-red-600">(Your answer)</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {(q.type === "Identification" || q.type === "True or False") && (
                                <div className="mb-3">
                                     <p className={`flex items-center p-2 rounded border ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                         {isCorrect ? <CheckIcon/> : <XIcon/>}
                                         <span className="font-semibold mr-2">Your Answer:</span>
                                         <span className={isCorrect ? 'text-green-700' : 'text-red-700 line-through'}>{userAnswer || "No answer"}</span>
                                     </p>
                                     {!isCorrect && (
                                          <p className="flex items-center p-2 mt-2 rounded border border-green-300 bg-green-50">
                                              <CheckIcon/>
                                              <span className="font-semibold mr-2">Correct Answer:</span>
                                              <span className="text-green-700">{q.answer}</span>
                                          </p>
                                     )}
                                </div>
                            )}
                            <p className="text-xs text-gray-400">Type: {q.type}</p>
                        </div>
                    );
                })}
                <div className="flex justify-center mt-8 space-x-4">
                     <button
                        onClick={handleRetakeQuiz}
                        className="px-6 py-2 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all"
                    >
                        Retake Quiz
                    </button>
                    <button
                        onClick={() => navigate('/quizzes')} // Go back to quiz list/generation
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all"
                    >
                        Finish Review
                    </button>
                </div>
            </div>
        );
    }

    // --- Quiz Taking View ---
    return (
        <div className="p-4 sm:p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{quizTitle}</h1>
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
                <div className="mb-5 pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    <p className="text-lg font-semibold text-gray-800 mt-1">{currentQuestion.question}</p>
                </div>

                <div className="space-y-4">
                    {/* Multiple Choice */}
                    {currentQuestion.type === "Multiple Choice" && currentQuestion.options && (
                        currentQuestion.options.map((option, index) => (
                            <label key={index} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-indigo-50 border-indigo-300' : 'border-gray-300 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name={`question-${currentQuestionIndex}`}
                                    value={option}
                                    checked={userAnswers[currentQuestionIndex] === option}
                                    onChange={() => handleAnswerSelect(currentQuestionIndex, option)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-gray-700">{option}</span>
                            </label>
                        ))
                    )}

                    {/* Identification */}
                    {currentQuestion.type === "Identification" && (
                         <div>
                             <label htmlFor={`answer-${currentQuestionIndex}`} className="block text-sm font-medium text-gray-700 mb-1">Your Answer:</label>
                             <input
                                id={`answer-${currentQuestionIndex}`}
                                type="text"
                                value={userAnswers[currentQuestionIndex] || ''}
                                onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Type your answer here..."
                            />
                         </div>
                    )}

                    {/* True or False */}
                    {currentQuestion.type === "True or False" && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleAnswerSelect(currentQuestionIndex, "True")}
                                className={`flex-1 py-3 px-4 border rounded-lg font-semibold transition-all ${userAnswers[currentQuestionIndex] === "True" ? 'bg-green-100 border-green-400 text-green-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            >
                                True
                            </button>
                            <button
                                onClick={() => handleAnswerSelect(currentQuestionIndex, "False")}
                                className={`flex-1 py-3 px-4 border rounded-lg font-semibold transition-all ${userAnswers[currentQuestionIndex] === "False" ? 'bg-red-100 border-red-400 text-red-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                            >
                                False
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="px-5 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>

                    {currentQuestionIndex === questions.length - 1 ? (
                        <button
                            onClick={handleSubmitQuiz}
                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition-all disabled:opacity-70"
                            // Optionally disable if not all questions answered
                            // disabled={Object.keys(userAnswers).length !== questions.length}
                        >
                            Submit Quiz
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
