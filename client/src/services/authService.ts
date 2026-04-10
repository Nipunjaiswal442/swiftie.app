import api from './api';

export const authenticateWithGoogle = async (idToken: string) => {
  const response = await api.post('/api/auth/google', { idToken });
  return response.data;
};
