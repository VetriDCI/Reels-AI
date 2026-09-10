import api from './api';

export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  upload: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/ai/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  history: () => api.get('/ai/history'),
  getConversation: (id) => api.get(`/ai/history/${id}`),
  deleteConversation: (id) => api.delete(`/ai/history/${id}`),
  generateImage: (data) => api.post('/ai/image', data)
};

export default aiAPI;
