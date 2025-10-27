import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// --- Icon Components ---
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="mr-2 h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 
      5.373 0 12h4zm2 5.291A7.962 7.962 0 
      014 12H0c0 3.042 1.135 5.824 3 
      7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Main Settings Component ---
const Settings = () => {
  const { user, updateUser, token } = useAuth();

  // States
  const [name, setName] = useState('');
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [newProfilePicFile, setNewProfilePicFile] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success',
  });

  // Base API URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // --- Fetch and Initialize User Data ---
  useEffect(() => {
    if (!user) return;

    setName(user.username || '');
    if (user.profilePicUrl) {
      const isFullUrl =
        user.profilePicUrl.startsWith('http') || user.profilePicUrl.startsWith('blob');
      setProfilePicUrl(isFullUrl ? user.profilePicUrl : `${API_BASE_URL}${user.profilePicUrl}`);
    } else {
      setProfilePicUrl('');
    }
    setIsLoading(false);
  }, [user]);

  // --- Notification Helper ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // --- Handle Profile Picture Change ---
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePicFile(file);
      setProfilePicUrl(URL.createObjectURL(file));
    }
  };

  // --- Save Profile Changes ---
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData();
    formData.append('username', name);
    if (newProfilePicFile) formData.append('newProfilePic', newProfilePicFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile.');

      updateUser?.(data.user);
      setNewProfilePicFile(null);
      showNotification('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Change Password Handler ---
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showNotification("New passwords don't match!", 'error');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to change password.');

      showNotification('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="bg-gray-50/50 min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="bg-gray-50/50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm relative">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and settings.</p>

          {notification.show && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm ${
                notification.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* --- Profile Section --- */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Profile</h2>
            <form
              onSubmit={handleSaveChanges}
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
            >
              {/* Profile Picture */}
              <div className="md:col-span-1">
                <h3 className="font-medium text-gray-700">Profile Picture</h3>
                <p className="text-sm text-gray-500 mt-1">Update your profile picture.</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {profilePicUrl ? (
                      <img src={profilePicUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon />
                    )}
                  </div>
                  <input
                    type="file"
                    id="profilePicInput"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    disabled={isSaving}
                  />
                  <label
                    htmlFor="profilePicInput"
                    className={`cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors ${
                      isSaving ? 'bg-gray-200 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <UploadIcon /> Change
                  </label>
                </div>
              </div>

              {/* Name */}
              <div className="md:col-span-1 pt-6">
                <h3 className="font-medium text-gray-700">Personal Information</h3>
                <p className="text-sm text-gray-500 mt-1">Update your name.</p>
              </div>
              <div className="md:col-span-2 pt-6">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSaving}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                />
              </div>

              <div className="md:col-start-2 md:col-span-2 text-right">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isSaving && <Spinner />}
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* --- Change Password Section --- */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Change Password</h2>
            <form
              onSubmit={handleChangePassword}
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-1">
                <h3 className="font-medium text-gray-700">Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your current and new password.
                </p>
              </div>

              <div className="md:col-span-2 space-y-4">
                {[
                  { id: 'current-password', label: 'Current Password', value: currentPassword, set: setCurrentPassword },
                  { id: 'new-password', label: 'New Password', value: newPassword, set: setNewPassword },
                  { id: 'confirm-password', label: 'Confirm New Password', value: confirmPassword, set: setConfirmPassword },
                ].map(({ id, label, value, set }) => (
                  <div key={id}>
                    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                      {label}
                    </label>
                    <input
                      type="password"
                      id={id}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      disabled={isSaving}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>
                ))}

                <div className="text-right">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {isSaving && <Spinner />}
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
