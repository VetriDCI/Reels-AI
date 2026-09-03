import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const uploadAPI = {
  media: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/posts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const postAPI = {
  create: (data) => api.post('/posts', data),
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getById: (id) => api.get(`/posts/${id}`),
  delete: (id) => api.delete(`/posts/${id}`),
  like: (id) => api.post(`/posts/${id}/like`),
  addComment: (id, content) => api.post(`/posts/${id}/comments`, { content })
};

export const aiAPI = {
  generateCaption: (data) => api.post('/ai/generate-caption', data),
  generateHashtags: (data) => api.post('/ai/generate-hashtags', data),
  translate: (data) => api.post('/ai/translate', data),
  moderate: (data) => api.post('/ai/moderate', data),
  chat: (data) => api.post('/ai/chat', data)
};

export const searchAPI = {
  search: (query, type = 'all') => api.get(`/search?query=${query}&type=${type}`)
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: () => api.put('/notifications/read')
};

export const chatAPI = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  createChat: (participantId) => api.post('/chats', { participantId }),
  sendMessage: (chatId, content) => api.post(`/chats/${chatId}/messages`, { content })
};

export const followAPI = {
  follow: (userId) => api.post(`/follow/${userId}`),
  getStatus: (userId) => api.get(`/follow/${userId}/status`)
};

export default api;