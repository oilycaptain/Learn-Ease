import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fileAPI, quizAPI } from "../utils/api";

// --- Icon Components ---
const StandardModeIcon = () => (
  <svg
    className="h-8 w-8 mb-2 text-indigo-600"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="8" y1="12" x2="16" y2="12"></line>
    <line x1="8" y1="16" x2="16" y2="16"></line>
    <line x1="8" y1="8" x2="12" y2="8"></line>
  </svg>
);

const GameModeIcon = () => (
  <svg
    className="h-8 w-8 mb-2 text-indigo-600"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.42 10.18a8.5 8.5 0 0 0-16.84 0" />
    <path d="M12 2a8.5 8.5 0 0 0-8.42 10.18L12 22l8.42-9.82A8.5 8.5 0 0 0 12 2z" />
    <path d="M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 mr-3 text-white"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const Quizzes = () => {
  const API_BASE_URL = "http://localhost:5000";
  const { token } = useAuth();
  const navigate = useNavigate();
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [view, setView] = useState("config");
  const [studyMaterial, setStudyMaterial] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizMode, setQuizMode] = useState("standard");
  const [quizTypes, setQuizTypes] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const showNotification = (message, type = "error") => {
    if (type === "clear") {
      setNotification({ show: false, message: "", type: "error" });
    } else {
      setNotification({ show: true, message, type });
      if (type === "success")
        setTimeout(
          () => setNotification({ show: false, message: "", type: "error" }),
          3000
        );
    }
  };

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data } = await fileAPI.getFiles();
        setStudyMaterials(
          Array.isArray(data.files)
            ? data.files
            : Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error("Error fetching materials:", error);
        showNotification(
          error.response?.data?.message || "Could not load study materials.",
          "error"
        );
      } finally {
        setIsLoadingMaterials(false);
      }
    };
    fetchMaterials();
  }, []);

  // Generate AI quiz from file
  const handleGenerateQuiz = async () => {
    if (!studyMaterial)
      return showNotification("Select a study material!", "error");
    if (quizTypes.length === 0)
      return showNotification("Select at least one quiz type!", "error");

    setIsGenerating(true);
    showNotification("", "clear");

    try {
      let data;
      if (quizAPI?.generateCustomFromFile) {
        const res = await quizAPI.generateCustomFromFile(studyMaterial, {
          numQuestions,
          quizTypes,
        });
        data = res.data;
      } else {
        const res = await fetch(
          `${API_BASE_URL}/api/quiz/generate-from-file/${studyMaterial}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ numQuestions, quizTypes }),
          }
        );
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to generate quiz.");
      }

      if (!data.questions || !data.questions.length)
        throw new Error("No questions returned.");

      // ✅ Route based on selected mode
      const routeMap = {
        timed: "/gamemode/timed",
        lives: "/gamemode/lives",
        streak: "/gamemode/streak",
        standard: "/take-quiz",
      };

      navigate(routeMap[quizMode], {
  state: {
    questions: data.questions,
    quizTitle: data.quizTitle,
    fileId: studyMaterial,
    timePerQuestion: quizMode === "timed" ? timePerQuestion : undefined, // 👈 pass the time
  },
});

    } catch (err) {
      console.error(err);
      showNotification(err.message || "Failed to generate quiz.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuizType = (type) => {
    setQuizTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleModeSelect = (mode) => {
    setQuizMode(mode);
    if (mode === "standard") setView("type");
    else setView("game");
  };

  // --- Game Mode Selection Screen ---
  if (view === "game") {
    const gameModes = [
      {
        title: "⏱️ Timed Quiz",
        desc: "Answer all questions before time runs out! Accuracy and speed both matter.",
        mode: "timed",
        color: "from-blue-100 to-blue-200",
      },
      {
        title: "❤️ Lives Challenge",
        desc: "Start with 3 lives. Each wrong answer costs one — can you survive till the end?",
        mode: "lives",
        color: "from-red-100 to-pink-200",
      },
      {
        title: "🔥 Streak Mode",
        desc: "Test your consistency! Build the longest correct answer streak.",
        mode: "streak",
        color: "from-orange-100 to-yellow-200",
      },
    ];

    return (
      <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-full">
        <div className="w-full max-w-3xl bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Select Game Mode
          </h1>
          <p className="text-gray-600 mt-2 mb-8">
            Choose how you want to play your quiz — challenge yourself in fun
            and competitive ways!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gameModes.map((g) => (
              <div
                key={g.mode}
                onClick={() => {
                  setQuizMode(g.mode);
                  setView("type");
                }}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all bg-gradient-to-br ${g.color} ${
                  quizMode === g.mode
                    ? "border-indigo-600 shadow-md scale-105"
                    : "border-gray-200 hover:border-indigo-400 hover:shadow"
                }`}
              >
                <h3 className="text-xl font-semibold text-gray-800">
                  {g.title}
                </h3>
                <p className="text-gray-700 text-sm mt-2">{g.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setView("config")}
              className="px-6 py-2 border border-gray-300 rounded-lg"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Type Selection Screen ---
  // --- Type Selection Screen ---
if (view === "type") {
  return (
    <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-full">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900">Select Quiz Type</h1>
        <p className="text-gray-600 mt-2">
          Choose how you want to be tested. You can pick more than one.
        </p>

        {["Multiple Choice", "Identification", "True or False"].map((type) => (
          <div
            key={type}
            onClick={() => toggleQuizType(type)}
            className={`cursor-pointer p-4 border-2 rounded-xl flex items-center justify-between mt-4 transition-all ${
              quizTypes.includes(type)
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <span className="font-semibold text-gray-800">{type}</span>
            {quizTypes.includes(type) && (
              <span className="text-indigo-600 font-bold">✓</span>
            )}
          </div>
        ))}

        {/* --- Timed Mode Extra Setting --- */}
        {(quizMode === "timed" || quizMode === "standard") && (
  <div className="mt-6 text-left">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      ⏱️ Time per Question (in seconds)
    </label>
    <input
      type="number"
      min="5"
      max="120"
      value={timePerQuestion}
      onChange={(e) => setTimePerQuestion(e.target.value)} // free typing
      onBlur={(e) => {
        const val = e.target.value.replace(/^0+/, ""); // remove leading zeros
        setTimePerQuestion(val ? Number(val) : 5); // default 5 if empty
      }}
      placeholder="e.g. 15"
      className="block w-full px-4 py-3 border rounded-lg"
    />
    <p className="text-sm text-gray-500 mt-1">
      Recommended: 10–60 seconds per question
    </p>
  </div>
)}


        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setView("config")}
            className="px-6 py-2 border border-gray-300 rounded-lg"
          >
            Back
          </button>
          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || quizTypes.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg flex items-center"
          >
            {isGenerating && <Spinner />}
            {isGenerating ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}


  // --- Default Config View ---
  return (
    <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-full">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Generate A New Quiz
        </h1>
        <p className="text-gray-600 mt-2">
          Select your study material and configure your quiz.
        </p>

        {notification.show && notification.type === "error" && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800">
            {notification.message}
          </div>
        )}

        <div className="mt-10 text-left space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Study Material
            </label>
            <select
              value={studyMaterial}
              onChange={(e) => setStudyMaterial(e.target.value)}
              disabled={isLoadingMaterials}
              className="block w-full px-4 py-3 border rounded-lg"
            >
              <option value="" disabled>
                {isLoadingMaterials ? "Loading..." : "Select a material"}
              </option>
              {studyMaterials.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.originalName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              onClick={() => handleModeSelect("standard")}
              className={`cursor-pointer p-6 border-2 rounded-xl flex flex-col items-center justify-center ${
                quizMode === "standard"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300"
              }`}
            >
              <StandardModeIcon />
              <span className="font-semibold text-gray-800">Standard Mode</span>
            </div>
            <div
              onClick={() => handleModeSelect("game")}
              className={`cursor-pointer p-6 border-2 rounded-xl flex flex-col items-center justify-center ${
                quizMode === "game"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300"
              }`}
            >
              <GameModeIcon />
              <span className="font-semibold text-gray-800">Game Mode</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setView("type")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
