import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sticky sidebar sits on the left; the right column scrolls */}
      <Sidebar />
      <div className="flex-1 flex flex-col max-h-screen min-h-0">
        {/* Sticky top bar inside the right column */}
        <Navbar />
        {/* Only the main area scrolls */}
        <main className="flex-1 p-6 overflow-y-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
