// StudyMaterialCard.jsx — aligned and spacious card layout with disabled state
import React, { useState } from "react";
import { deleteStudyMaterial } from "../utils/api";

export default function StudyMaterialCard({
  studyMaterial,
  onDelete,
  onSelect,
  addToast,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const progress = Math.max(0, Math.min(100, Number(studyMaterial.progress ?? 40)));
  const hasReviewer = studyMaterial.generatedReviewer && studyMaterial.generatedReviewer.length > 0;

  const handleDelete = async () => {
    if (busy) return;
    if (!window.confirm("Delete this study material?")) return;
    try {
      setBusy(true);
      await deleteStudyMaterial(studyMaterial._id);
      onDelete?.(studyMaterial._id);
    } catch (e) {
      console.error(e);
      addToast?.("Failed to delete", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[340px] rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between">
      {/* Menu Button */}
      <div className="absolute right-3 top-3">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="More options"
        >
          <svg
            className="h-5 w-5 text-gray-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10">
            <button
              onClick={() => {
                setMenuOpen(false);
                onSelect?.(studyMaterial);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 text-blue-600 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Summarize
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Top Section */}
      <div>
        <h3 className="text-gray-900 font-semibold text-[16px] truncate pr-8">
          {studyMaterial.title || "Untitled Material"}
        </h3>

        {/* Icons Row */}
        <div className="mt-3 flex items-center gap-5 text-gray-500">
          {/* Document icon */}
          <div className="flex items-center gap-1">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M7 7h10M7 11h10M7 15h7" />
            </svg>
            <span className="text-xs">{studyMaterial.fileType?.toUpperCase()}</span>
          </div>

          {/* AI Status */}
          <div className={`flex items-center gap-1 ${hasReviewer ? 'text-green-600' : 'text-amber-600'}`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs">{hasReviewer ? 'AI Ready' : 'Generate AI'}</span>
          </div>
        </div>
      </div>

      {/* Middle Section - Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-[13px] text-gray-500">
          Last studied: {studyMaterial.timeAgo || "—"}
        </p>
      </div>

      {/* Bottom Section - Button */}
      <div className="mt-6">
        <button
          onClick={() => hasReviewer && onSelect?.(studyMaterial)}
          disabled={!hasReviewer}
          className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-medium shadow-sm focus-visible:ring-4 transition-all duration-200 ${
            hasReviewer 
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-200 cursor-pointer transform hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed focus-visible:ring-gray-100'
          }`}
        >
          {hasReviewer ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Notes
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Generate AI First
            </>
          )}
        </button>
      </div>
    </div>
  );
}