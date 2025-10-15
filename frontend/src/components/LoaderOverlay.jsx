import React, { useEffect, useState } from 'react';

/**
 * Full-screen loading overlay with animated dots and rotating messages.
 * Props:
 *  - show: boolean
 *  - messages?: string[] (rotates every 2s)
 */
const LoaderOverlay = ({ show, messages = [
  'Extracting text...',
  'Understanding your notes...',
  'Generating precise questions...',
  'Polishing explanations...'
] }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), 2000);
    return () => clearInterval(id);
  }, [show, messages.length]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md mx-4 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse w-3 h-3 rounded-full bg-gray-800"></div>
          <div className="animate-pulse w-3 h-3 rounded-full bg-gray-500"></div>
          <div className="animate-pulse w-3 h-3 rounded-full bg-gray-300"></div>
          <h3 className="ml-2 font-semibold text-gray-900">Building your quiz</h3>
        </div>
        <p className="mt-3 text-gray-700">{messages[idx]}</p>
        <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite] bg-gray-800 rounded-full"></div>
        </div>
        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(50%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
        <p className="mt-2 text-xs text-gray-500">This may take a moment depending on file size and model speed.</p>
      </div>
    </div>
  );
};

export default LoaderOverlay;
