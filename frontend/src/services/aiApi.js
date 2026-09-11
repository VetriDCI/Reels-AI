import api from './api';

export const aiAPI = {
  capabilities: () => api.get('/ai/capabilities'),
  health: () => api.get('/ai/health'),
  usage: () => api.get('/ai/usage'),
  chat: (data) => api.post('/ai/chat', data),
  research: (data) => api.post('/ai/research', data),
  coding: (data) => api.post('/ai/coding', data),
  dataAnalysis: (data) => api.post('/ai/data-analysis', data),
  writing: (data) => api.post('/ai/writing', data),
  social: (data) => api.post('/ai/social', data),
  creative: (data) => api.post('/ai/creative', data),
  video: (data) => api.post('/ai/video', data),
  generateImage: (data) => api.post('/ai/generate-image', data),
  generateVideo: (data) => api.post('/ai/generate-video', data),
  transcribe: (file) => { const formData = new FormData(); formData.append('audio', file); return api.post('/ai/transcribe', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  memories: () => api.get('/ai/memory'),
  saveMemory: (data) => api.post('/ai/memory', data),
  deleteMemory: (id) => api.delete(`/ai/memory/${id}`),
  analyzeFiles: (files, task = 'summarize', question = '') => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('task', task);
    formData.append('question', question);
    return api.post('/ai/file-analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
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
};

export default aiAPI;
