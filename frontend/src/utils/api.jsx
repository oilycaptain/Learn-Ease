import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (username, email, password) => api.post('/auth/signup', { username, email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const chatAPI = {
  getChats: () => api.get('/chat'),
  getChat: (chatId) => api.get(`/chat/${chatId}`),
  createChat: (title) => api.post('/chat', { title }),
  sendMessage: (chatId, message) => api.post(`/chat/${chatId}/messages`, { message }),
  deleteChat: (chatId) => api.delete(`/chat/${chatId}`),
  updateChatTitle: (chatId, title) => api.patch(`/chat/${chatId}/title`, { title }),
};

export const fileAPI = {
  uploadFile: (formData) =>
    api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getFiles: () => api.get('/files'),
  getFileContent: (fileId) => api.get(`/files/${fileId}/content`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  generateReviewer: (fileId) => api.post(`/files/${fileId}/generate-reviewer`),
};

export const studyAPI = {
  uploadStudyMaterial: async (formData) => {
    const response = await api.post('/study/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data', Accept: 'application/json' },
    });
    return response.data;
  },
  getStudyMaterials: async () => {
    const response = await api.get('/study/materials');
    return response.data;
  },
  generateReviewer: async (materialId, customInstructions = '', mode = 'enhanced') => {
    const response = await api.post(`/study/generate-reviewer/${materialId}`, {
      customInstructions,
      mode,
    });
    return response.data;
  },
  deleteStudyMaterial: async (materialId) => {
    const response = await api.delete(`/study/materials/${materialId}`);
    return response.data;
  },
  getStudyMaterial: async (materialId) => {
    const response = await api.get(`/study/materials/${materialId}`);
    return response.data;
  },
  updateStudyMaterial: async (materialId, updates) => {
    const response = await api.patch(`/study/materials/${materialId}`, updates);
    return response.data;
  },
};

export const uploadStudyMaterial = studyAPI.uploadStudyMaterial;
export const getStudyMaterials = studyAPI.getStudyMaterials;
export const generateStudyReviewer = studyAPI.generateReviewer;
export const deleteStudyMaterial = studyAPI.deleteStudyMaterial;
export const generateReviewer = studyAPI.generateReviewer;

export const quizAPI = {
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (quizId) => api.get(`/quizzes/${quizId}`),
  getAttempts: () => api.get('/quizzes/attempts'),
  submitAttempt: (quizId, data) => api.post(`/quizzes/${quizId}/attempt`, data),
  deleteQuiz: (quizId) => api.delete(`/quizzes/${quizId}`),
  generateFromFile: (fileId, data) => api.post(`/quiz/generate-from-file/${fileId}`, data),
  generateQuick: (data) => api.post('/quizzes/generate-quick', data),
  generateCustomFromFile: (fileId, data) => api.post(`/quizzes/generate-custom-from-file/${fileId}`, data),
  generateCustomQuick: (data) => api.post('/quizzes/generate-custom-quick', data),
  generateHybridFromFile: (fileId, data) => api.post(`/quizzes/generate-hybrid-from-file/${fileId}`, data),
};

export default api;
