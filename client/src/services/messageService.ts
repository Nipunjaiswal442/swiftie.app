import api from './api';

export const getMessages = async (conversationId: string, before?: string, limit = 50) => {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  params.set('limit', limit.toString());

  const response = await api.get(
    `/api/conversations/${conversationId}/messages?${params.toString()}`
  );
  return response.data;
};
