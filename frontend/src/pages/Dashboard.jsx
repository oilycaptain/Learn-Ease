import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: "Quizzes Taken", value: "12", change: "+3", trend: "up" },
    { label: "Notes Uploaded", value: "8", change: "+1", trend: "up" },
    { label: "Study Hours", value: "24.5", change: "+2.5", trend: "up" },
    { label: "Mastered Topics", value: "15", change: "+2", trend: "up" }
  ];

  const quickActions = [
    { title: "Upload Notes", desc: "Upload PDFs, DOCX, or TXT files to create study materials", icon: "📥", color: "from-blue-500 to-indigo-500" },
    { title: "Smart Summarize", desc: "AI-powered summaries that extract key points", icon: "⚡", color: "from-pink-500 to-purple-500" },
    { title: "Quick Quiz", desc: "Generate a quick practice quiz from your notes", icon: "🧠", color: "from-green-500 to-emerald-500" },
    { title: "Flashcards", desc: "Create flashcards for spaced repetition", icon: "🗂️", color: "from-orange-500 to-red-500" }
  ];

  const recentActivity = [
    { action: "Quiz Completed", topic: "Biology Basics", score: "85%", time: "2 hours ago" },
    { action: "Notes Uploaded", topic: "Chemistry Notes", score: "-", time: "5 hours ago" },
    { action: "Summary Created", topic: "Physics Chapter 3", score: "-", time: "1 day ago" },
    { action: "Quiz Completed", topic: "Mathematics", score: "92%", time: "2 days ago" }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Welcome back, {user?.username || 'Learner'}! 👋</h2>
          <p className="opacity-90">Ready to continue your learning journey? You're doing great!</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">🎯</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                i===0?'bg-blue-50':i===1?'bg-purple-50':i===2?'bg-green-50':'bg-orange-50'
              }`}>🏆</div>
            </div>
            <div className={`mt-3 text-sm ${s.trend==='up'?'text-green-600':'text-red-600'}`}>
              <span className="font-semibold">{s.change}</span><span className="ml-1">this week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {quickActions.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center bg-gradient-to-r ${a.color}`}>{a.icon}</div>
            <h3 className="mt-4 font-semibold text-gray-900">{a.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{a.desc}</p>
            <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">Open →</button>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((r, i) => (
            <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <span className="text-xl">🧠</span>
                <div>
                  <p className="font-medium text-gray-900">{r.action}</p>
                  <p className="text-sm text-gray-600">{r.topic}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{r.time}</p>
                <p className="text-sm font-semibold text-green-600">{r.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
