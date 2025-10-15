import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Quizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('my-quizzes');
  const [generatingQuiz, setGeneratingQuiz] = useState(null);
  const [quickQuizSubject, setQuickQuizSubject] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  
  // STATE FOR CUSTOMIZATION
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('multiple-choice');
  const [customTimeLimit, setCustomTimeLimit] = useState(10);
  const [topics, setTopics] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [seed, setSeed] = useState('');
  const [hybridMix, setHybridMix] = useState({
    mcq: 50,
    tf: 25,
    fill: 25
  });

  useEffect(() => {
    loadQuizzes();
    loadAttempts();
    loadFiles();
  }, []);

  const loadQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const loadAttempts = async () => {
    try {
      const response = await api.get('/quizzes/attempts');
      setAttempts(response.data);
    } catch (error) {
      console.error('Error loading attempts:', error);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Original quick quiz generation (non-custom)
  const generateQuickQuiz = async () => {
    if (!quickQuizSubject.trim()) {
      alert('Please enter a subject');
      return;
    }
    
    setGeneratingQuiz('quick');
    
    try {
      await api.post('/quizzes/generate-quick', {
        subject: quickQuizSubject,
        questionCount: questionCount
      });
      setQuickQuizSubject('');
      await loadQuizzes();
      alert('Quick quiz created!');
    } catch (error) {
      console.error('Error creating quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Error creating quiz: ' + errorMessage);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  // Original file-based quiz generation (non-custom)
  const generateQuizFromFile = async (fileId) => {
    if (!fileId) {
      alert('Please select a file');
      return;
    }
    
    setGeneratingQuiz(fileId);
    
    try {
      await api.post(`/quizzes/generate-from-file/${fileId}`, {
        questionCount: questionCount
      });
      await loadQuizzes();
      alert('Quiz generated successfully!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Error generating quiz: ' + errorMessage);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  // Custom quiz generation from file
  const generateCustomQuizFromFile = async (fileId) => {
    if (!fileId) {
      alert('Please select a file');
      return;
    }
    
    setGeneratingQuiz(fileId + '-custom');
    
    try {
      const payload = {
        questionCount: questionCount,
        difficulty: difficulty,
        quizType: quizType,
        timeLimit: customTimeLimit,
        topics: topics.split(',').map(t => t.trim()).filter(t => t),
        shuffleQuestions: shuffleQuestions,
        shuffleOptions: shuffleOptions
      };

      // Add hybrid mix if quiz type is hybrid
      if (quizType === 'hybrid') {
        payload.questionMix = { 
          'multiple-choice': hybridMix.mcq, 
          'true-false': hybridMix.tf, 
          'fill-blank': hybridMix.fill 
        };
        payload.seed = seed;
      }

      const endpoint = quizType === 'hybrid' 
        ? `/quizzes/generate-hybrid-from-file/${fileId}`
        : `/quizzes/generate-custom-from-file/${fileId}`;

      await api.post(endpoint, payload);
      await loadQuizzes();
      alert('Custom quiz generated successfully!');
      setShowCustomOptions(false);
    } catch (error) {
      console.error('Error generating custom quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // If custom parameters fail, fall back to basic generation
      if (error.response?.status === 500) {
        alert('Custom quiz feature not available. Generating basic quiz instead.');
        generateQuizFromFile(fileId);
      } else {
        alert('Error generating quiz: ' + errorMessage);
      }
    } finally {
      setGeneratingQuiz(null);
    }
  };

  // Custom quick quiz generation
  const generateCustomQuickQuiz = async () => {
    if (!quickQuizSubject.trim()) {
      alert('Please enter a subject');
      return;
    }
    
    setGeneratingQuiz('quick-custom');
    
    try {
      const payload = {
        subject: quickQuizSubject,
        questionCount: questionCount,
        difficulty: difficulty,
        quizType: quizType,
        timeLimit: customTimeLimit,
        topics: topics.split(',').map(t => t.trim()).filter(t => t),
        shuffleQuestions: shuffleQuestions,
        shuffleOptions: shuffleOptions
      };

      // Add hybrid mix if quiz type is hybrid
      if (quizType === 'hybrid') {
        payload.questionMix = { 
          'multiple-choice': hybridMix.mcq, 
          'true-false': hybridMix.tf, 
          'fill-blank': hybridMix.fill 
        };
        payload.seed = seed;
      }

      await api.post('/quizzes/generate-quick', payload);
      setQuickQuizSubject('');
      await loadQuizzes();
      alert('Custom quick quiz created!');
      setShowCustomOptions(false);
    } catch (error) {
      console.error('Error creating custom quiz:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      
      // If custom parameters fail, fall back to basic generation
      if (error.response?.status === 500) {
        alert('Custom quiz feature not available. Generating basic quiz instead.');
        generateQuickQuiz();
      } else {
        alert('Error creating quiz: ' + errorMessage);
      }
    } finally {
      setGeneratingQuiz(null);
    }
  };

  // Quick upload handler
  const handleQuickUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setGeneratingQuiz('quick-upload');
      const form = new FormData();
      form.append('file', file);
      
      // Upload file
      const uploadResponse = await api.post('/files/upload', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      const fileId = uploadResponse.data?.file?._id;
      if (!fileId) {
        alert('Upload succeeded but no file id returned');
        setGeneratingQuiz(null);
        return;
      }
      
      // Prepare payload
      const payload = {
        questionCount,
        difficulty,
        quizType,
        timeLimit: customTimeLimit,
        shuffleQuestions,
        shuffleOptions,
        seed
      };

      // Add hybrid mix if quiz type is hybrid
      if (quizType === 'hybrid') {
        payload.questionMix = { 
          'multiple-choice': hybridMix.mcq, 
          'true-false': hybridMix.tf, 
          'fill-blank': hybridMix.fill 
        };
      }

      // Choose endpoint based on quiz type
      const endpoint = quizType === 'hybrid'
        ? `/quizzes/generate-hybrid-from-file/${fileId}`
        : `/quizzes/generate-custom-from-file/${fileId}`;

      await api.post(endpoint, payload);
      await loadQuizzes();
      alert('Quiz generated from upload!');
    } catch (error) {
      console.error('Quick upload failed', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Quick upload/generate failed: ' + errorMessage);
    } finally {
      setGeneratingQuiz(null);
      e.target.value = '';
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await api.delete(`/quizzes/${quizId}`);
      await loadQuizzes();
      alert('Quiz deleted successfully!');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Error deleting quiz');
    }
  };

  const startQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const updateHybridMix = (type, value) => {
    setHybridMix(prev => ({
      ...prev,
      [type]: parseInt(value) || 0
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
          <p className="text-gray-600">Test your knowledge with AI-generated quizzes</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('my-quizzes')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'my-quizzes' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            My Quizzes
          </button>
          <button
            onClick={() => setActiveTab('create-quiz')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'create-quiz' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Create Quiz
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'history' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            History
          </button>
        </div>

        {/* Customization Toggle */}
        {activeTab === 'create-quiz' && (
          <div className="mb-6">
            <button
              onClick={() => setShowCustomOptions(!showCustomOptions)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <span>⚙️</span>
              <span>{showCustomOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
            </button>
          </div>
        )}

        {/* Advanced Customization Options */}
        {showCustomOptions && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Customization</h3>
            
            {/* Question Count */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
              <input
                type="number"
                min="1"
                max="50"
                className="mt-1 w-full border rounded-lg p-2"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Type
                </label>
                <select
                  value={quizType}
                  onChange={(e) => setQuizType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-blank">Fill in Blank</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (min)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customTimeLimit}
                  onChange={(e) => setCustomTimeLimit(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Topics
                </label>
                <input
                  type="text"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g., algebra, geometry"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Hybrid Quiz Options */}
            {quizType === 'hybrid' && (
              <div className="border-t pt-4 mt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Question Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Multiple Choice (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={hybridMix.mcq}
                      onChange={(e) => updateHybridMix('mcq', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      True/False (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={hybridMix.tf}
                      onChange={(e) => updateHybridMix('tf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fill Blank (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={hybridMix.fill}
                      onChange={(e) => updateHybridMix('fill', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  Total: {hybridMix.mcq + hybridMix.tf + hybridMix.fill}%
                  {hybridMix.mcq + hybridMix.tf + hybridMix.fill !== 100 && (
                    <span className="text-red-500 ml-2">Should total 100%</span>
                  )}
                </div>
              </div>
            )}

            {/* Additional Options */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Options</h4>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Shuffle Options</span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Random Seed (optional)
                </label>
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Enter seed for reproducible quizzes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* My Quizzes Tab */}
        {activeTab === 'my-quizzes' && (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                      {quiz.difficulty && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      )}
                      {quiz.quizType && quiz.quizType !== 'multiple-choice' && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {quiz.quizType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📚 {quiz.subject}</span>
                      <span>•</span>
                      <span>❓ {quiz.totalQuestions} questions</span>
                      <span>•</span>
                      <span>⏱️ {quiz.timeLimit} min</span>
                      {quiz.attempts > 0 && (
                        <>
                          <span>•</span>
                          <span>📊 Avg: {quiz.averageScore}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => startQuiz(quiz._id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Start Quiz
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {quizzes.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">🧩</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No quizzes yet</h3>
                <p className="text-gray-600">Create your first quiz to get started!</p>
              </div>
            )}
          </div>
        )}

        {/* Create Quiz Tab */}
        {activeTab === 'create-quiz' && (
          <div className="space-y-6">
            {/* Quick Upload */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Upload</h3>
              <p className="text-sm text-gray-600 mb-4">Drop a file here to upload and generate a quiz directly.</p>
              <input
                type="file"
                onChange={handleQuickUpload}
                className="w-full p-2 border border-gray-300 rounded-lg"
                disabled={generatingQuiz === 'quick-upload'}
              />
              {generatingQuiz === 'quick-upload' && (
                <p className="text-blue-500 mt-2">Uploading and generating quiz...</p>
              )}
            </div>
    
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Quick Quiz */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Quiz</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={quickQuizSubject}
                      onChange={(e) => setQuickQuizSubject(e.target.value)}
                      placeholder="e.g., Mathematics, Biology"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Questions: {questionCount}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={generateQuickQuiz}
                      disabled={!quickQuizSubject.trim() || generatingQuiz === 'quick'}
                      className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {generatingQuiz === 'quick' ? 'Creating...' : 'Quick Create'}
                    </button>
                    
                    <button
                      onClick={generateCustomQuickQuiz}
                      disabled={!quickQuizSubject.trim() || generatingQuiz === 'quick-custom'}
                      className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {generatingQuiz === 'quick-custom' ? 'Creating...' : 'Custom Create'}
                    </button>
                  </div>
                </div>
              </div>

              {/* From Study Materials */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">From Study Materials</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    <select
                      value={selectedFile}
                      onChange={(e) => setSelectedFile(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a study material</option>
                      {files.map((file) => (
                        <option key={file._id} value={file._id}>
                          {file.originalName} ({file.subject})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Questions: {questionCount}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="20"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => generateQuizFromFile(selectedFile)}
                      disabled={!selectedFile || generatingQuiz === selectedFile}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {generatingQuiz === selectedFile ? 'Generating...' : 'Quick Generate'}
                    </button>
                    
                    <button
                      onClick={() => generateCustomQuizFromFile(selectedFile)}
                      disabled={!selectedFile || generatingQuiz === selectedFile + '-custom'}
                      className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {generatingQuiz === selectedFile + '-custom' ? 'Generating...' : 'Custom Generate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{attempt.quiz.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📚 {attempt.quiz.subject}</span>
                      <span>•</span>
                      <span>🕒 {new Date(attempt.completedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>⏱️ {Math.round(attempt.timeSpent / 60)}m</span>
                    </div>
                  </div>
                  
                  <div className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                    {attempt.score}%
                  </div>
                </div>
                
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${attempt.score}%` }}
                  ></div>
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  {attempt.correctCount} out of {attempt.totalQuestions} correct
                </div>
              </div>
            ))}

            {attempts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No quiz history</h3>
                <p className="text-gray-600">Complete some quizzes to see your progress here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;