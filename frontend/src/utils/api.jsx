import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
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
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFiles: () => api.get('/files'),
  getFileContent: (fileId) => api.get(`/files/${fileId}/content`),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  generateReviewer: (fileId) => api.post(`/files/${fileId}/generate-reviewer`),
};

export const quizAPI = {
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (quizId) => api.get(`/quizzes/${quizId}`),
  getAttempts: () => api.get('/quizzes/attempts'),
  generateFromFile: (fileId, data) => api.post(`/quiz/generate-from-file/${fileId}`, data), // match backend
  generateCustomFromFile: (fileId, data) => api.post(`/quiz/generate-from-file/${fileId}`, data), // <-- correct
  generateQuick: (data) => api.post('/quizzes/generate-quick', data),
  generateCustomQuick: (data) => api.post('/quizzes/generate-custom-quick', data),
  generateHybridFromFile: (fileId, data) => api.post(`/quizzes/generate-hybrid-from-file/${fileId}`, data),
  submitAttempt: (quizId, data) => api.post(`/quizzes/${quizId}/attempt`, data),
  deleteQuiz: (quizId) => api.delete(`/quizzes/${quizId}`),
};

export default api;
