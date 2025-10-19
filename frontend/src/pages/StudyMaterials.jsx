import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StudyMaterials = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [viewingContent, setViewingContent] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const fileInputRef = useRef(null);
  const [subject, setSubject] = useState('');
  const [tags, setTags] = useState('');

  // Load user's files
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const file = fileList[0];
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('subject', subject);
    formData.append('tags', tags);

    try {
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSelectedFile(null);
      setSubject('');
      setTags('');
      loadFiles();
      alert('File uploaded! Click "Generate Reviewer" to create AI study guide.');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      loadFiles();
      setViewingContent(null);
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: ' + error.response?.data?.message || error.message);
    }
  };

  const generateReviewer = async (fileId) => {
    setGeneratingId(fileId);
    try {
      const response = await api.post(`/files/${fileId}/generate-reviewer`);
      loadFiles();
      alert(response.data.message || 'AI Study Reviewer generated successfully!');
    } catch (error) {
      console.error('Reviewer generation error:', error);
      alert('Failed to generate reviewer: ' + error.response?.data?.message || error.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const viewOriginal = async (file) => {
    try {
      const response = await api.get(`/files/${file._id}/content`);
      setViewingContent({
        type: 'original',
        content: response.data.content,
        title: `File Information - ${file.originalName}`,
        fileType: file.fileType
      });
    } catch (error) {
      console.error('Error loading file content:', error);
      setViewingContent({
        type: 'original',
        content: `Unable to load file content.\n\nFile: ${file.originalName}\nType: ${file.fileType}\nSize: ${formatFileSize(file.fileSize)}`,
        title: `File Info - ${file.originalName}`,
        fileType: file.fileType
      });
    }
  };

  const viewReviewer = (file) => {
    setViewingContent({
      type: 'reviewer',
      content: file.summary || 'No reviewer generated yet.',
      title: `AI Study Reviewer - ${file.originalName}`,
      fileType: file.fileType
    });
  };

  // NEW: Download Original File function
  const downloadOriginalFile = (file) => {
    const downloadUrl = `http://localhost:5000/uploads/${file.filename}`;
    window.open(downloadUrl, '_blank');
  };

  const downloadContent = (content, filename) => {
    const element = document.createElement("a");
    const fileBlob = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyContent = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess('Copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: '📕',
      docx: '📄',
      doc: '📄',
      txt: '📝',
      pptx: '📊'
    };
    return icons[fileType] || '📁';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        

        {/* Copy Success Message */}
        {copySuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {copySuccess}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Study Material</h2>
              
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-4xl mb-3">📤</div>
                <p className="text-gray-600 mb-2">
                  {selectedFile ? selectedFile.name : 'Drag & drop your file here'}
                </p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf,.docx,.doc,.txt,.pptx"
                />
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-800 font-medium">Selected: {selectedFile.name}</p>
                  <p className="text-green-600 text-sm">Size: {formatFileSize(selectedFile.size)}</p>
                </div>
              )}

              {/* Upload Form */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics, Biology"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={uploadFile}
                  disabled={!selectedFile || uploading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload File'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* File Library */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Study Materials</h2>
                <span className="text-gray-400">📚</span>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No study materials yet</h3>
                  <p className="text-gray-600">Upload your first study material to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="text-3xl">{getFileIcon(file.fileType)}</div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{file.originalName}</h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>•</span>
                              <span>{file.fileType.toUpperCase()}</span>
                              <span>•</span>
                              <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                            </div>
                            {file.subject && (
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                                {file.subject}
                              </span>
                            )}
                            
                            {/* AI Reviewer Preview */}
                            {file.summary && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-gray-700 line-clamp-2">{file.summary}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                    ✅ AI Reviewer Ready
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          {/* Generate Reviewer Button */}
                          <button
                            onClick={() => generateReviewer(file._id)}
                            disabled={generatingId === file._id}
                            className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {generatingId === file._id ? (
                              <div className="flex items-center">
                                <div className="w-3 h-3 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                                Generating...
                              </div>
                            ) : (
                              'Generate Reviewer'
                            )}
                          </button>

                          {/* NEW: Download Original Button */}
                          <button
                            onClick={() => downloadOriginalFile(file)}
                            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            Download Original
                          </button>

                          {/* View Reviewer Button */}
                          <button
                            onClick={() => viewReviewer(file)}
                            disabled={!file.summary}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View Reviewer
                          </button>

                          {/* View Original Button */}
                          <button
                            onClick={() => viewOriginal(file)}
                            className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            View Info
                          </button>

                          {/* Download & Copy Buttons (for AI Reviewer) */}
                          {file.summary && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => downloadContent(file.summary, `Reviewer - ${file.originalName}.txt`)}
                                className="flex-1 px-2 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors"
                              >
                                Download Reviewer
                              </button>
                              <button
                                onClick={() => copyContent(file.summary)}
                                className="flex-1 px-2 py-1 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition-colors"
                              >
                                Copy Reviewer
                              </button>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteFile(file._id)}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Viewer Modal */}
        {viewingContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{viewingContent.title}</h3>
                <button
                  onClick={() => setViewingContent(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-gray-700 text-sm">
                  {viewingContent.content}
                </pre>
              </div>

              <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    copyContent(viewingContent.content);
                  }}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Copy Text
                </button>
                <button
                  onClick={() => {
                    downloadContent(viewingContent.content, `${viewingContent.title}.txt`);
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setViewingContent(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;