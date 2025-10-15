import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();


  const stats = [
    { label: "Quizzes Taken", value: "12", change: "+3", trend: "up" },
    { label: "Notes Uploaded", value: "8", change: "+1", trend: "up" },
    { label: "Study Hours", value: "24.5", change: "+2.5", trend: "up" },
    { label: "Mastered Topics", value: "15", change: "+2", trend: "up" }
  ];

  const features = [
    {
      title: "Upload Notes",
      description: "Upload PDFs, DOCX, or TXT files to create study materials",
      icon: "📤",
      color: "from-blue-500 to-cyan-500",
      buttonText: "Upload Files"
    },
    {
      title: "Smart Summarize",
      description: "AI-powered summaries that extract key points from your notes",
      icon: "⚡",
      color: "from-purple-500 to-pink-500",
      buttonText: "Create Summary"
    },
    {
      title: "Generate Quizzes",
      description: "Automatically create practice tests and track your progress",
      icon: "🧠",
      color: "from-green-500 to-emerald-500",
      buttonText: "Start Quiz"
    },
    {
      title: "Study Analytics",
      description: "Track your learning progress and identify strengths",
      icon: "📊",
      color: "from-orange-500 to-red-500",
      buttonText: "View Stats"
    }
  ];

  const recentActivity = [
    { action: "Quiz Completed", topic: "Biology Basics", score: "85%", time: "2 hours ago" },
    { action: "Notes Uploaded", topic: "Chemistry Notes", score: "-", time: "5 hours ago" },
    { action: "Summary Created", topic: "Physics Chapter 3", score: "-", time: "1 day ago" },
    { action: "Quiz Completed", topic: "Mathematics", score: "92%", time: "2 days ago" }
  ];

  const navigationItems = [
  { id: 'overview', label: 'Overview', icon: '📊', clickable: true },
  { id: 'study', label: 'Study Materials', icon: '📚', clickable: true }, // Change to true
  { id: 'quizzes', label: 'Quizzes', icon: '🧩', clickable: true },
  { id: 'analytics', label: 'Analytics', icon: '📈', clickable: false },
  { id: 'ask-ai', label: 'Ask AI', icon: '🤖', clickable: true },
  { id: 'settings', label: 'Settings', icon: '⚙️', clickable: false }
];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">LE</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LearnEase</h1>
              <p className="text-xs text-gray-600">Study Companion</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
  <ul className="space-y-2">
    {navigationItems.map((item) => (
      <li key={item.id}>
        {item.clickable ? (
          <button
            onClick={() => {
              if (item.id === 'ask-ai') {
                navigate('/ask-ai');
              } else if (item.id === 'study') {
                navigate('/study-materials');
              } else if (item.id === 'quizzes') {
                navigate('/quizzes');
              } else {
                setActiveTab(item.id);
              }
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ) : (
          <div className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed opacity-60">
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded-md ml-auto">
              Soon
            </span>
          </div>
        )}
      </li>
    ))}
  </ul>
</nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
              <p className="text-xs text-gray-600">Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
              <p className="text-sm text-gray-600">
                {activeTab === 'overview' && 'Welcome to your learning dashboard'}
                {activeTab === 'study' && 'Manage your study materials and notes'}
                {activeTab === 'quizzes' && 'Take quizzes and track your progress'}
                {activeTab === 'analytics' && 'View your learning analytics and insights'}
                {activeTab === 'ask-ai' && 'Get AI-powered answers and explanations'}
                {activeTab === 'settings' && 'Manage your account and preferences'}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notes, quizzes..."
                  className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors duration-200">
                <span className="text-lg">🔔</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Logout */}
              <button 
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}! 👋</h1>
                    <p className="text-blue-100 text-lg">Ready to continue your learning journey? You're doing great!</p>
                  </div>
                  <div className="text-6xl">🎯</div>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                        index === 0 ? 'from-blue-100 to-blue-200' :
                        index === 1 ? 'from-purple-100 to-purple-200' :
                        index === 2 ? 'from-green-100 to-green-200' :
                        'from-orange-100 to-orange-200'
                      } flex items-center justify-center`}>
                        <span className={`text-xl ${
                          index === 0 ? 'text-blue-600' :
                          index === 1 ? 'text-purple-600' :
                          index === 2 ? 'text-green-600' :
                          'text-orange-600'
                        }`}>🏆</span>
                      </div>
                    </div>
                    <div className={`flex items-center mt-3 text-sm ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="font-semibold">{stat.change}</span>
                      <span className="ml-1">this week</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <div className="lg:col-span-2">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                      <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                          <span className="text-2xl text-white">{feature.icon}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                        <button className={`w-full py-3 px-4 rounded-xl bg-gradient-to-r ${feature.color} text-white font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200`}>
                          {feature.buttonText}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                      <span className="text-gray-400">📄</span>
                    </div>
                    
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            activity.action.includes('Quiz') ? 'bg-green-100 text-green-600' :
                            activity.action.includes('Upload') ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.action.includes('Quiz') ? <span>🧠</span> :
                             activity.action.includes('Upload') ? <span>📤</span> :
                             <span>⚡</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{activity.action}</p>
                            <p className="text-sm text-gray-600 truncate">{activity.topic}</p>
                            {activity.score !== '-' && (
                              <p className="text-xs font-semibold text-green-600 mt-1">Score: {activity.score}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-6 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                      View All Activity
                    </button>
                  </div>
                </div>
              </div>

              {/* Motivation Quote */}
              <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-center text-white">
                <h3 className="text-xl font-bold mb-2">Keep pushing forward! 🚀</h3>
                <p className="opacity-90">"The beautiful thing about learning is that no one can take it away from you." - B.B. King</p>
              </div>
            </div>
          )}

          {/* Other Tabs Content */}
          {activeTab !== 'overview' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {activeTab === 'study' && '📚'}
                  {activeTab === 'quizzes' && '🧩'}
                  {activeTab === 'analytics' && '📈'}
                  {activeTab === 'ask-ai' && '🤖'}
                  {activeTab === 'settings' && '⚙️'}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {activeTab === 'study' && 'Study Materials'}
                  {activeTab === 'quizzes' && 'Quiz Center'}
                  {activeTab === 'analytics' && 'Learning Analytics'}
                  {activeTab === 'ask-ai' && 'Ask AI Assistant'}
                  {activeTab === 'settings' && 'Account Settings'}
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  {activeTab === 'study' && 'Upload, organize, and manage all your study materials in one place. Create summaries and generate quizzes from your notes.'}
                  {activeTab === 'quizzes' && 'Take AI-generated quizzes, track your scores, and identify areas for improvement.'}
                  {activeTab === 'analytics' && 'View detailed insights about your learning progress, study habits, and performance trends.'}
                  {activeTab === 'ask-ai' && 'Get instant answers to your questions and personalized explanations using our AI assistant.'}
                  {activeTab === 'settings' && 'Manage your account preferences, notification settings, and learning goals.'}
                </p>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl max-w-md mx-auto">
                  <p className="text-yellow-800 text-sm">
                    <span className="font-semibold">Coming Soon!</span> This feature is currently under development.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;