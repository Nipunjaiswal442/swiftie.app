import api from './api';

export const getConversations = async () => {
  const response = await api.get('/api/conversations');
  return response.data;
};

export const createConversation = async (participantId: string) => {
  const response = await api.post('/api/conversations', { participantId });
  return response.data;
};

export const getConversation = async (id: string) => {
  const response = await api.get(`/api/conversations/${id}`);
  return response.data;
};
