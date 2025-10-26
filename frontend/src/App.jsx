import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- Pages & Components ---
import Home from './pages/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard';
import StudyMaterials from './pages/StudyMaterials';
import AskAI from './pages/AskAI';
import Quizzes from './pages/Quizzes';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import QuizPage from "./pages/QuizPage";
import TimedQuiz from "./pages/TimedQuiz";
import LivesChallenge from "./pages/LivesChallenge";
import StreakMode from "./pages/StreakMode"; // 🆕 Added Streak Mode

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes (Require Login) */}
<Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/study-materials" element={<StudyMaterials />} />
  <Route path="/ask-ai" element={<AskAI />} />
  <Route path="/quizzes" element={<Quizzes />} />
  <Route path="/analytics" element={<Analytics />} />
  <Route path="/settings" element={<Settings />} />
  <Route path="/take-quiz" element={<QuizPage />} />
  <Route path="/quiz/:id" element={<QuizPage />} />
</Route>

{/* ✅ Game Modes (NO SIDEBAR, FULL SCREEN) */}
<Route
  path="/gamemode/timed"
  element={user ? <TimedQuiz /> : <Navigate to="/login" />}
/>
<Route
  path="/gamemode/lives"
  element={user ? <LivesChallenge /> : <Navigate to="/login" />}
/>
<Route
  path="/gamemode/streak"
  element={user ? <StreakMode /> : <Navigate to="/login" />}
/>


        {/* Catch-All Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
