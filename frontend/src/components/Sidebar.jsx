import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const initial =
    (user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const items = [
    { to: '/dashboard',        label: 'Overview',         icon: '📊' },
    { to: '/study-materials',  label: 'Study Materials',  icon: '📚' },
    { to: '/quizzes',          label: 'Quizzes',          icon: '🧩' },
    { to: '/analytics',        label: 'Analytics',        icon: '📈' },
    { to: '/ask-ai',           label: 'Ask AI',           icon: '🤖' },
    { to: '/settings',         label: 'Settings',         icon: '⚙️' },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
      isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col sticky top-0 h-screen">
      {/* Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">LE</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">LearnEase</h1>
            <p className="text-xs text-gray-500 -mt-1">Study Companion</p>
          </div>
        </div>
      </div>

      {/* Nav list (scrolls if long) */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/dashboard'}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User profile (sticks at bottom) */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
