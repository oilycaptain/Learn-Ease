// ReviewerModal.jsx - Large modal for displaying generated reviewer
import React from 'react';

const ReviewerModal = ({ studyMaterial, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatReviewerContent = (content) => {
    if (!content) return null;

    return content.split('\n').map((line, index) => {
      if (line.match(/^[0-9]+\./)) {
        return <h4 key={index} className="font-semibold mt-6 mb-3 text-blue-700 text-lg">{line}</h4>;
      } else if (line.match(/^[A-Z][A-Z\s]+:/)) {
        return <h3 key={index} className="font-bold mt-8 mb-4 text-green-700 text-xl border-b-2 pb-2 border-green-200">{line}</h3>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-3 leading-relaxed text-gray-700 text-base">{line}</p>;
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Generated Reviewer</h2>
                <p className="text-gray-600 mt-1">{studyMaterial.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white rounded-xl transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="h-[calc(90vh-120px)] overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="prose prose-lg max-w-none">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                {formatReviewerContent(studyMaterial.generatedReviewer)}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Generated {new Date(studyMaterial.updatedAt || studyMaterial.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigator.clipboard.writeText(studyMaterial.generatedReviewer)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Text
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerModal;