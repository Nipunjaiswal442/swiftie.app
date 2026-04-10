import api from './api';

export const uploadKeyBundle = async (bundle: {
  registrationId: number;
  identityKey: string;
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
}) => {
  const response = await api.post('/api/keys/bundle', bundle);
  return response.data;
};

export const getKeyBundle = async (userId: string) => {
  const response = await api.get(`/api/keys/bundle/${userId}`);
  return response.data;
};

export const replenishKeys = async (
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>
) => {
  const response = await api.post('/api/keys/replenish', { oneTimePreKeys });
  return response.data;
};
