// ReviewerGenerator.jsx - With file information display
import React, { useState } from 'react';
import { generateReviewer } from '../utils/api';

const ReviewerGenerator = ({ studyMaterial, onReviewerGenerated, addToast }) => {
  const [customInstructions, setCustomInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState('enhanced');

  const handleGenerateReviewer = async () => {
    if (!studyMaterial) return;

    setGenerating(true);
    try {
      const response = await generateReviewer(
        studyMaterial._id, 
        customInstructions,
        generationMode
      );
      onReviewerGenerated(response.studyMaterial);
    } catch (error) {
      console.error('Generation error:', error);
      addToast('Failed to generate reviewer: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const getModeLabel = (mode) => {
    const modes = {
      strict: 'Strict (Content Only)',
      enhanced: 'Enhanced (AI Knowledge)',
      custom: 'Custom Instructions'
    };
    return modes[mode] || mode;
  };

  const getModeDescription = (mode) => {
    const descriptions = {
      strict: 'Only uses content from your uploaded file. No additional AI knowledge.',
      enhanced: 'Enhances your content with AI knowledge, examples, and explanations.',
      custom: 'Follows your specific instructions exactly.'
    };
    return descriptions[mode] || '';
  };

  return (
    <div className="bg-white rounded-xl p-1">
      {/* File Information Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm border border-gray-200">
            <span className="text-lg">
              {studyMaterial.fileType === '.pdf' ? '📄' : 
               studyMaterial.fileType === '.docx' ? '📝' : 
               studyMaterial.fileType === '.txt' ? '📄' : '📎'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 truncate text-lg">{studyMaterial.title}</h4>
            <p className="text-sm text-gray-600 truncate">{studyMaterial.originalName}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="bg-white px-2 py-1 rounded-md border">{studyMaterial.fileType.toUpperCase()}</span>
              <span>{(studyMaterial.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              <span>{new Date(studyMaterial.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Content Preview:</span>{' '}
            {studyMaterial.content.length > 150 
              ? studyMaterial.content.substring(0, 150) + '...' 
              : studyMaterial.content}
          </p>
        </div>
      </div>
      
      {/* Generation Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Generation Mode
        </label>
        <div className="space-y-3">
          {['strict', 'enhanced', 'custom'].map((mode) => (
            <label key={mode} className="flex items-start space-x-3 cursor-pointer group">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="radio"
                  name="generationMode"
                  value={mode}
                  checked={generationMode === mode}
                  onChange={(e) => setGenerationMode(e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                  {getModeLabel(mode)}
                </span>
                <p className="text-xs text-gray-500 mt-1">{getModeDescription(mode)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {generationMode === 'custom' ? 'Specific Instructions (Required)' : 'Custom Instructions (Optional)'}
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder={
            generationMode === 'strict' 
              ? "E.g., 'Keep it very simple, no extra examples'"
              : generationMode === 'enhanced'
              ? "E.g., 'Focus on practical applications', 'Add more examples'"
              : "E.g., 'Create a quiz format', 'Explain like I'm 10 years old', 'Focus on key formulas only'"
          }
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required={generationMode === 'custom'}
        />
      </div>

      <button
        onClick={handleGenerateReviewer}
        disabled={generating || studyMaterial.isProcessing || (generationMode === 'custom' && !customInstructions)}
        className={`w-full py-4 px-4 rounded-xl font-semibold transition-all duration-300 ${
          generating || studyMaterial.isProcessing || (generationMode === 'custom' && !customInstructions)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
        }`}
      >
        {generating ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            Generating AI Reviewer...
          </div>
        ) : studyMaterial.isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
            Processing File...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate AI Reviewer
          </div>
        )}
      </button>

      {/* Tips Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-amber-800 text-sm font-medium">Pro Tips</p>
            <p className="text-amber-700 text-sm mt-1">
              For best results, ensure your file has clear, structured content. 
              {generationMode === 'strict' && ' Strict mode works best with well-organized study materials.'}
              {generationMode === 'enhanced' && ' Enhanced mode can provide additional context and examples.'}
              {generationMode === 'custom' && ' Be specific with your instructions for optimal results.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewerGenerator;