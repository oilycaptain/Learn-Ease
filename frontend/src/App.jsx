import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Login from './components/Login';
import Signup from './components/Signup';

import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard';
import StudyMaterials from './pages/StudyMaterials';
import AskAI from './pages/AskAI';
import Quizzes from './pages/Quizzes';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import QuizPage from "./pages/QuizPage";
function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />

        {/* All authed pages share global Navbar + Sidebar */}
        <Route element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/study-materials" element={<StudyMaterials />} />
          <Route path="/ask-ai" element={<AskAI />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
