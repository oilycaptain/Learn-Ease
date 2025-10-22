import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// --- Mock AuthContext for Preview ---
// This mock is necessary for the component to render correctly in the isolated preview environment.
// In your actual application, you would remove this mock function and use the real import below.
const useAuth = () => {
    return {
        logout: () => {
            console.log("Logout function called");
            // In a real app, this would clear the user's token and state.
        }
    };
};
// import { useAuth } from '../context/AuthContext';


const META = [
  { match: /^\/dashboard/,       title: 'Overview',        subtitle: 'Welcome to your learning dashboard' },
  { match: /^\/study-materials/, title: 'Study Materials', subtitle: 'Manage your study materials and notes' },
  { match: /^\/quizzes/,         title: 'Quizzes',         subtitle: 'Take quizzes and track your progress' },
  { match: /^\/analytics/,       title: 'Analytics',       subtitle: 'View your learning analytics and insights' },
  { match: /^\/ask-ai/,          title: 'Ask AI',          subtitle: 'Get AI-powered answers and explanations' },
  { match: /^\/settings/,        title: 'Settings',        subtitle: 'Manage your account and preferences' },
];

function usePageMeta(pathname) {
  for (const m of META) if (m.match.test(pathname)) return m;
  return META[0];
}

const Navbar = () => {
  const { pathname } = useLocation();
  const { title, subtitle } = usePageMeta(pathname);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Title + Subtitle */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        {/* Right: Bell */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Notifications" aria-label="Notifications">
            <span className="text-lg">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

