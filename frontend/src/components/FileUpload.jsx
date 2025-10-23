// FileUpload.jsx
import React, { useState } from 'react';
import { uploadStudyMaterial } from '../utils/api';

const FileUpload = ({ onUploadSuccess, addToast }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExt)) {
      addToast('Please upload PDF, TXT, DOC, DOCX, or MD files only.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addToast('File size must be less than 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) {
        formData.append('title', title);
      }

      const response = await uploadStudyMaterial(formData);
      onUploadSuccess(response.studyMaterial);
      setTitle('');
    } catch (error) {
      console.error('Upload error:', error);
      addToast('Failed to upload file: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Upload Study Material</h3>
          <p className="text-gray-500 text-sm">Add new files to generate AI reviewers</p>
        </div>
      </div>
      
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (Optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this material"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50 shadow-inner'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && document.getElementById('file-input').click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 font-medium">Uploading your file...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-2">
                <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PDF, TXT, DOC, DOCX, MD (Max 10MB)
              </p>
            </div>
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files[0])}
        accept=".pdf,.txt,.doc,.docx,.md"
        disabled={uploading}
      />

      {/* File Type Warning */}
      <div className="mt-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-amber-800 text-sm font-medium">For Best Results</p>
            <p className="text-amber-700 text-sm mt-1">
              Use <strong className="font-semibold">.txt files</strong> for optimal AI reviewer generation. 
              .docx and .pdf files may have limited text extraction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;