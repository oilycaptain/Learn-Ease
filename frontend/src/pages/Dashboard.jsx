import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

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

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    { label: "Quizzes Taken", value: "12", icon: <ChartBarIcon />, color: "text-blue-500", bgColor: "bg-blue-50" },
    { label: "Notes Uploaded", value: "12", icon: <DocumentTextIcon />, color: "text-green-500", bgColor: "bg-green-50" },
    { label: "Questions Asked", value: "12", icon: <QuestionMarkCircleIcon />, color: "text-purple-500", bgColor: "bg-purple-50" },
    { label: "Study Hours", value: "12", icon: <ClockIcon />, color: "text-orange-500", bgColor: "bg-orange-50" }
  ];

  const quickActions = [
    { title: "Upload Notes", icon: <DocumentTextIcon />, to: "/study-materials" },
    { title: "Ask Question", icon: <QuestionMarkCircleIcon />, to: "/ask-ai" },
    { title: "Generate Quiz", icon: <ChartBarIcon />, to: "/quizzes" }
  ];

  const recentActivity = [
    { icon: <ChartBarIcon />, color: "text-blue-500", title: "Biology Chapter 3", time: "2 hours ago", score: "85%" },
    { icon: <DocumentTextIcon />, color: "text-green-500", title: "Chemistry Notes", time: "5 hours ago", score: null },
    { icon: <QuestionMarkCircleIcon />, color: "text-purple-500", title: "Physics Question", time: "1 day ago", score: null },
    { icon: <ClockIcon />, color: "text-orange-500", title: "Studied Math", time: "2 days ago", score: null }
  ];

  return (
    <div className="bg-slate-50 min-h-full p-6">
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-3xl font-bold mt-1 text-gray-800">{s.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bgColor} ${s.color}`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((r, i) => (
                <div key={i} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 transition-all hover:shadow-md hover:border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full bg-gray-50 ${r.color}`}>
                        {r.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{r.title}</p>
                      <p className="text-sm text-gray-500">{r.time}</p>
                    </div>
                  </div>
                  {r.score && (
                    <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      {r.score}
                    </div>
                  )}
                </div>
              ))}
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

