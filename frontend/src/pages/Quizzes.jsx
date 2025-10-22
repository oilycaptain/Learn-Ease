import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fileAPI, quizAPI } from "../utils/api"; // Ensure these are correctly configured

// --- Icon Components ---
const StandardModeIcon = () => (
  <svg className="h-8 w-8 mb-2 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="8" y1="12" x2="16" y2="12"></line>
    <line x1="8" y1="16" x2="16" y2="16"></line>
    <line x1="8" y1="8" x2="12" y2="8"></line>
  </svg>
);

const GameModeIcon = () => (
  <svg className="h-8 w-8 mb-2 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.42 10.18a8.5 8.5 0 0 0-16.84 0" />
    <path d="M12 2a8.5 8.5 0 0 0-8.42 10.18L12 22l8.42-9.82A8.5 8.5 0 0 0 12 2z" />
    <path d="M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  </svg>
);

const MultipleChoiceIcon = () => (
  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const IdentificationIcon = () => (
  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="7" y1="12" x2="17" y2="12"></line>
  </svg>
);

const TrueFalseIcon = () => (
  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
    <path d="M2 17l10 5 10-5"></path>
    <path d="M2 12l10 5 10-5"></path>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ---------------------- MAIN COMPONENT ----------------------
const Quizzes = () => {
  const API_BASE_URL = "http://localhost:5000"; // Backend URL
  const { token } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("config");
  const [studyMaterial, setStudyMaterial] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizMode, setQuizMode] = useState("standard");
  const [quizTypes, setQuizTypes] = useState([]);
  const [studyMaterials, setStudyMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "error" });

  const showNotification = (message, type = "error") => {
    if (type === "clear") {
      setNotification({ show: false, message: "", type: "error" });
    } else {
      setNotification({ show: true, message, type });
      if (type === "success") setTimeout(() => setNotification({ show: false, message: "", type: "error" }), 3000);
    }
  };

  // ------------------ Fetch Study Materials ------------------
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!fileAPI || typeof fileAPI.getFiles !== "function") {
        console.error("fileAPI or fileAPI.getFiles not defined");
        showNotification("API utility not found. Cannot load materials.", "error");
        setStudyMaterials([]);
        setIsLoadingMaterials(false);
        return;
      }

      try {
        console.log("Fetching materials using fileAPI...");
        const { data } = await fileAPI.getFiles();
        console.log("API response:", data);
        // If your backend returns array directly
        setStudyMaterials(Array.isArray(data.files) ? data.files : Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching materials:", error);
        showNotification(error.response?.data?.message || "Could not load study materials.", "error");
      } finally {
        setIsLoadingMaterials(false);
      }
    };

    fetchMaterials();
  }, []);

  // ------------------ Quiz Generation ------------------
  const handleGenerateQuiz = async () => {
    if (!studyMaterial) {
      showNotification("Please select a study material first!", "error");
      return;
    }

    setIsGenerating(true);
    showNotification("", "clear");

    const payload = { numQuestions: Number(numQuestions), quizTypes };

    try {
      let data;

      if (quizAPI?.generateCustomFromFile) {
        console.log(`Calling quizAPI.generateCustomFromFile for file ID: ${studyMaterial}`);
        const response = await quizAPI.generateCustomFromFile(studyMaterial, payload);
        data = response.data;
      } else {
        console.log(`Fetching from backend: ${API_BASE_URL}/api/quiz/generate-from-file/${studyMaterial}`);
        const response = await fetch(`${API_BASE_URL}/api/quiz/generate-from-file/${studyMaterial}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const raw = await response.text();
        console.log("Raw backend response:", raw);

        try {
          data = JSON.parse(raw);
        } catch (parseError) {
          console.error("Failed to parse backend JSON:", parseError);
          throw new Error("Invalid JSON returned from server. Check backend logs.");
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to generate quiz via fetch.");
        }
      }

      console.log("Parsed backend response:", data);

      if (data.questions && data.questions.length > 0) {
        console.log("Generated Questions:", data.questions);
        showNotification("Quiz generated successfully!", "success");
        // navigate("/take-quiz", { state: { questions: data.questions, title: data.quizTitle } });
        setView("config");
      } else {
        throw new Error("Backend did not return valid quiz questions.");
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      showNotification(error.message || "Failed to generate quiz.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // ------------------ Mode / Type Select ------------------
  const handleModeSelect = (mode) => {
    setQuizMode(mode);
    if (mode === "standard") setView("type");
    else alert("Game mode selected! (Coming soon!)");
  };

  const toggleQuizType = (type) => {
    setQuizTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  // ------------------ Render ------------------
  if (view === "type") {
    return (
      <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-full">
        <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-gray-900">Select Quiz Type</h1>
          <p className="text-gray-600 mt-2">Choose how you want to be tested. You can pick more than one.</p>

          {notification.show && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${notification.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
              {notification.message}
            </div>
          )}

          <div className="mt-10 space-y-4 text-left">
            {["Multiple Choice", "Identification", "True or False"].map((type) => (
              <div key={type} onClick={() => toggleQuizType(type)} className={`cursor-pointer p-6 border-2 rounded-xl flex items-center transition-all ${quizTypes.includes(type) ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}>
                <div className="mr-4">
                  {type === "Multiple Choice" && <MultipleChoiceIcon />}
                  {type === "Identification" && <IdentificationIcon />}
                  {type === "True or False" && <TrueFalseIcon />}
                </div>
                <div><h3 className="font-semibold text-gray-800">{type}</h3></div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setView("config")} className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">Back</button>
            <button onClick={handleGenerateQuiz} disabled={quizTypes.length === 0 || isGenerating} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating && <Spinner />}
              {isGenerating ? "Generating..." : "Generate Quiz"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex items-center justify-center p-4 sm:p-8 min-h-full">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900">Generate A New Quiz</h1>
        <p className="text-gray-600 mt-2">Select your study material and configure your quiz.</p>

        {notification.show && notification.type === "error" && (
          <div className="mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800">{notification.message}</div>
        )}

        <div className="mt-10 text-left space-y-8">
          <div>
            <label htmlFor="study-material" className="block text-sm font-medium text-gray-700 mb-1">Select Study Material</label>
            <select
              id="study-material"
              value={studyMaterial}
              onChange={(e) => setStudyMaterial(e.target.value)}
              disabled={isLoadingMaterials}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="" disabled>{isLoadingMaterials ? "Loading materials..." : "Select a material..."}</option>
              {studyMaterials.map((m) => <option key={m._id} value={m._id}>{m.originalName}</option>)}
            </select>
            {!isLoadingMaterials && studyMaterials.length === 0 && <p className="mt-2 text-sm text-gray-500">No study materials uploaded yet. Upload some files first!</p>}
          </div>

          <div>
            <label htmlFor="num-questions" className="block text-sm font-medium text-gray-700">
              Number of Questions: <span className="font-bold text-indigo-600">{numQuestions}</span>
            </label>
            <input id="num-questions" type="range" min="1" max="20" value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div onClick={() => handleModeSelect("standard")} className={`cursor-pointer p-6 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${quizMode === "standard" ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}>
              <StandardModeIcon />
              <span className="font-semibold text-gray-800">Standard Mode</span>
            </div>
            <div onClick={() => handleModeSelect("game")} className={`cursor-pointer p-6 border-2 rounded-xl flex flex-col items-center justify-center transition-all ${quizMode === "game" ? "border-indigo-600 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}`}>
              <GameModeIcon />
              <span className="font-semibold text-gray-800">Game Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
