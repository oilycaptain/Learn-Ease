// src/pages/Login.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    if (!result.success) setError(result.message);

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80')`,
      }}
    >
      {/* dark overlay for contrast */}
      <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"></div>

      {/* content */}
      <div className="relative z-10 w-full max-w-md bg-white bg-opacity-95 p-8 rounded-2xl shadow-2xl">
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          LearnEase
        </h1>
        <p className="text-center text-gray-600 mt-1 mb-6">Your Smart Study Companion</p>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 text-sm rounded-md px-4 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-medium bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:text-indigo-700">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
