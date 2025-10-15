import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './pages/Dashboard';
import AskAI from './pages/AskAI'; // Add this import
import StudyMaterials from './pages/StudyMaterials';
import Quizzes from './pages/Quizzes';
import QuizPage from './pages/QuizPage';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <main>
          <Routes>
            <Route 
  path="/quizzes" 
  element={user ? <Quizzes /> : <Navigate to="/login" />} 
/>
<Route 
  path="/quiz/:id" 
  element={user ? <QuizPage /> : <Navigate to="/login" />} 
/>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={!user ? <Login /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/signup" 
              element={!user ? <Signup /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/login" />} 
            />
            {/* Add AskAI route */}
            <Route 
              path="/ask-ai" 
              element={user ? <AskAI /> : <Navigate to="/login" />} 
            />
            <Route 
  path="/study-materials" 
  element={user ? <StudyMaterials /> : <Navigate to="/login" />} 
/>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;