// StudyMaterials.jsx — with centered modal and file name display
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getStudyMaterials, uploadStudyMaterial } from "../utils/api";
import StudyMaterialCard from "../components/StudyMaterialCard";
import ReviewerGenerator from "../components/ReviewerGenerator";
import ReviewerModal from "../components/ReviewerModal";
import Toast from "../components/Toast";

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [viewerMaterial, setViewerMaterial] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const addToast = (message, type = "info") =>
    setToasts((t) => [...t, { id: crypto.randomUUID(), message, type }]);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getStudyMaterials();
        if (!mounted) return;
        setMaterials(Array.isArray(data) ? data : data?.materials || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load study materials.");
        addToast("Failed to load study materials", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    let list = [...materials];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.subject?.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "az":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "progress":
        list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
      default:
        list.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
        );
    }
    return list;
  }, [materials, query, sortBy]);

  const handleDelete = (id) => {
    setMaterials((prev) => prev.filter((m) => m._id !== id));
    addToast("Study material deleted", "success");
  };

  const openPicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const onFilePicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    
    setUploading(true);
    addToast("Uploading file…", "info");
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const name = file.name.replace(/\.[^/.]+$/, "");
      formData.append('title', name);

      const response = await uploadStudyMaterial(formData);
      const newMaterial = response?.studyMaterial || response;
      
      if (newMaterial) {
        setMaterials((prev) => [newMaterial, ...prev]);
        addToast("Upload successful", "success");
      } else {
        addToast("Upload completed but response was unexpected", "info");
      }
    } catch (err) {
      console.error('Upload error details:', err);
      const errorMessage = err.response?.data?.error || err.message || "Upload failed. Please try again.";
      addToast(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full w-full">
      {/* Header controls */}
      <div className="mx-auto max-w-screen-6xl px-6 md:px-3 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative w-full max-w-xl">
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 py-2.5 text-sm outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition"
            >
              <option value="recent">Sort by: Recent</option>
              <option value="az">Sort by: A–Z</option>
              <option value="progress">Sort by: Progress</option>
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.188l3.71-3.96a.75.75 0 111.1 1.02l-4.25 4.53a.75.75 0 01-1.1 0L5.21 8.29a.75.75 0 01.02-1.08z" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            title="Upload file"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:shadow-md focus-visible:ring-4 focus-visible:ring-indigo-100 transition ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.md,.rtf"
            className="hidden"
            onChange={onFilePicked}
          />
        </div>
      </div>

      {/* content */}
      <div className="w-full px-2 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">No study materials found.</p>
          </div>
        ) : (
          <div
            className="grid gap-11"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))" }}
          >
            {filtered.map((m) => (
              <StudyMaterialCard
                key={m._id}
                studyMaterial={{
                  ...m,
                  lastStudied: m.lastStudied || m.updatedAt || m.createdAt,
                  timeAgo: timeAgo(m.updatedAt || m.createdAt),
                }}
                onDelete={handleDelete}
                onSelect={(mat) => {
                  if (mat.generatedReviewer) {
                    setViewerMaterial(mat);
                  } else {
                    setSelectedMaterial(mat);
                  }
                }}
                addToast={addToast}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Summarize Modal - Now Centered */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMaterial(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">AI Reviewer Generator</h3>
                  <p className="text-sm text-gray-600">
                    Generating for: <span className="font-medium text-gray-900">{selectedMaterial.title}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Original file: {selectedMaterial.originalName} • {selectedMaterial.fileType.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="p-2 hover:bg-white rounded-lg transition-colors duration-200"
              >
                <svg
                  className="h-5 w-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(90vh-120px)] overflow-y-auto p-6">
              <ReviewerGenerator
                studyMaterial={selectedMaterial}
                onReviewerGenerated={(updatedMaterial) => {
                  setMaterials(prev => prev.map(m => 
                    m._id === updatedMaterial._id ? updatedMaterial : m
                  ));
                  setSelectedMaterial(null);
                  addToast("AI reviewer generated successfully!", "success");
                }}
                addToast={addToast}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Viewer Modal */}
      <ReviewerModal
        studyMaterial={viewerMaterial}
        isOpen={!!viewerMaterial}
        onClose={() => setViewerMaterial(null)}
      />

      {/* toasts */}
      <div className="fixed bottom-5 right-5 space-y-2 z-[60]">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </div>
  );
}