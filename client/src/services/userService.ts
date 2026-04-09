import api from './api';

export const getMe = async () => {
  const response = await api.get('/api/users/me');
  return response.data;
};

export const updateMe = async (data: Record<string, unknown>) => {
  const response = await api.put('/api/users/me', data);
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
};
