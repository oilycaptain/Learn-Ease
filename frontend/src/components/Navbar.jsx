import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const META = [
  { match: /^\/dashboard/,       title: 'Overview',        subtitle: 'Welcome to your learning dashboard' },
  { match: /^\/study-materials/, title: 'Study Materials', subtitle: 'Manage your study materials and notes' },
  { match: /^\/quizzes/,         title: 'Quizzes',         subtitle: 'Take quizzes and track your progress' },
  { match: /^\/analytics/,       title: 'Analytics',       subtitle: 'View your learning analytics and insights' },
  { match: /^\/ask-ai/,          title: 'Ask AI',          subtitle: 'Get AI-powered answers and explanations' },
  { match: /^\/settings/,        title: 'Settings',        subtitle: 'Manage your account and preferences' },
];

function usePageMeta(pathname) {
  for (const m of META) if (m.match.test(pathname)) return m;
  return META[0];
}

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { title, subtitle } = usePageMeta(pathname);

  const handleLogout = async () => {
    try { await logout(); } finally { navigate('/login'); }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title + Subtitle */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Right: Search / Bell / Divider / Logout */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes, quizzes..."
              className="w-72 px-4 py-2 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Notifications" aria-label="Notifications">
            <span className="text-lg">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <span className="w-px h-6 bg-gray-200" />

          <button onClick={handleLogout} className="text-gray-700 hover:underline">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
