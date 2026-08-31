import api from './api';

export const aiAPI = {
  generateCaption: (data) => api.post('/ai/generate-caption', data),
  generateHashtags: (data) => api.post('/ai/generate-hashtags', data),
  translate: (data) => api.post('/ai/translate', data),
  moderate: (data) => api.post('/ai/moderate', data),
  chat: (data) => api.post('/ai/chat', data),
};

export default aiAPI;