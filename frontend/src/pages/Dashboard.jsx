import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';

// Simple SVG Icons for the UI
const ChartBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const DocumentTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const QuestionMarkCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 8 8-4 8.293-8.293a1 1 0 000-1.414L17 5l-4-4z" />
    </svg>
);

// Helper function to calculate "time ago" without an external library
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [quizzesTaken, setQuizzesTaken] = useState(0); // NEW STATE
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch files, chats, and quizzes in parallel
        const [filesResponse, chatsResponse, quizzesResponse] = await Promise.all([
          api.get('/files'),
          api.get('/chat'),
          api.get('/quiz/taken') // FETCH QUIZZES TAKEN
        ]);

        const files = filesResponse.data || [];
        const chats = chatsResponse.data || [];
        const quizzes = quizzesResponse.data?.quizzes || [];

        // Calculate stats
        const notesUploaded = files.length;
        const questionsAsked = chats.length;
        const reviewersGenerated = files.filter(f => f.summary).length;
        setQuizzesTaken(quizzes.length); // UPDATE QUIZZES TAKEN COUNT

        setStats({
          notesUploaded,
          questionsAsked,
          reviewersGenerated
        });

        // Combine and sort recent activity (files + chats)
        const fileActivity = files.map(file => ({
          type: 'file',
          icon: <DocumentTextIcon />,
          color: 'text-green-500',
          title: file.originalName,
          date: new Date(file.uploadDate),
          actionText: `Uploaded ${timeAgo(file.uploadDate)}`,
          to: '/study-materials'
        }));

        const chatActivity = chats.map(chat => ({
          type: 'chat',
          icon: <QuestionMarkCircleIcon />,
          color: 'text-purple-500',
          title: chat.title,
          date: new Date(chat.lastActivity),
          actionText: `Chatted ${timeAgo(chat.lastActivity)}`,
          to: '/ask-ai'
        }));

        const combinedActivity = [...fileActivity, ...chatActivity]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

        setRecentActivity(combinedActivity);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { label: "Notes Uploaded", value: stats?.notesUploaded, icon: <DocumentTextIcon />, color: "text-green-500", bgColor: "bg-green-50" },
    { label: "AI Chats Started", value: stats?.questionsAsked, icon: <QuestionMarkCircleIcon />, color: "text-purple-500", bgColor: "bg-purple-50" },
    { label: "Reviewers Generated", value: stats?.reviewersGenerated, icon: <SparklesIcon />, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Quizzes Taken", value: quizzesTaken, icon: <ChartBarIcon />, color: "text-orange-500", bgColor: "bg-orange-50" }, // NOW DYNAMIC
  ];

  const quickActions = [
    { title: "Upload Notes", icon: <DocumentTextIcon />, to: "/study-materials" },
    { title: "Ask AI", icon: <QuestionMarkCircleIcon />, to: "/ask-ai" },
    { title: "Generate Quiz", icon: <ChartBarIcon />, to: "/quizzes" }
  ];

  return (
    <div className="bg-slate-50 min-h-full p-6">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              {loading ? (
                <div className="animate-pulse flex-1 flex justify-between items-center">
                    <div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-8 bg-gray-200 rounded w-12 mt-2"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-3xl font-bold mt-1 text-gray-800">{s.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bgColor} ${s.color}`}>
                    {s.icon}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 border border-gray-100 rounded-xl p-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                        </div>
                    </div>
                ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((r, i) => (
                  <Link
                    key={i}
                    to={r.to}
                    className="flex items-center justify-between border border-gray-100 rounded-xl p-4 transition-all hover:shadow-md hover:border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full bg-gray-50 ${r.color}`}>
                          {r.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 truncate max-w-xs">{r.title}</p>
                        <p className="text-sm text-gray-500">{r.actionText}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10">
                    <p className="text-gray-500">No recent activity. Upload a file or start a chat!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Quick Actions & Study Progress */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((a, i) => (
                  <Link
                    key={i}
                    to={a.to}
                    className="flex items-center space-x-4 border border-gray-200 rounded-xl p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-gray-500">{a.icon}</div>
                    <span className="font-semibold text-gray-700">{a.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Study Progress */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
              <h3 className="font-bold text-lg">Study Progress</h3>
              <p className="text-sm opacity-80 mt-1">Keep up the good work! You're making great progress.</p>
              <div className="w-full bg-white/30 rounded-full h-2.5 mt-6">
                <div className="bg-white rounded-full h-2.5" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-right opacity-90 mt-2">75% of weekly goal completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

