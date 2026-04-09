import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://swiftie-backend.onrender.com/api/v1';

const TOKEN_KEY = 'swiftie_token';
const USER_KEY = 'swiftie_user';

// Unified storage that works on both native and web
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

export { storage, TOKEN_KEY, USER_KEY };

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await storage.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.remove(TOKEN_KEY);
      await storage.remove(USER_KEY);
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const exchangeFirebaseToken = (idToken: string) =>
  api.post('/auth/firebase', { idToken }).then((r) => r.data.data);

// ── Users ───────────────────────────────────────────────────
export const getMe = () => api.get('/users/me').then((r) => r.data.data);
export const updateMe = (data: object) => api.put('/users/me', data).then((r) => r.data.data);
export const getUserById = (id: string) => api.get(`/users/${id}`).then((r) => r.data.data);
export const searchUsers = (q = '') => api.get('/users/search', { params: { q } }).then((r) => r.data.data);
export const followUser = (id: string) => api.post(`/users/${id}/follow`).then((r) => r.data.data);
export const unfollowUser = (id: string) => api.delete(`/users/${id}/follow`).then((r) => r.data.data);

// ── Posts ───────────────────────────────────────────────────
export const getFeed = (page = 1) => api.get('/feed', { params: { page } }).then((r) => r.data.data);
export const createPost = (data: object) => api.post('/posts', data).then((r) => r.data.data);
export const getPost = (id: string) => api.get(`/posts/${id}`).then((r) => r.data.data);
export const deletePost = (id: string) => api.delete(`/posts/${id}`).then((r) => r.data.data);
export const likePost = (id: string) => api.post(`/posts/${id}/like`).then((r) => r.data.data);
export const unlikePost = (id: string) => api.delete(`/posts/${id}/like`).then((r) => r.data.data);
export const addComment = (id: string, text: string) => api.post(`/posts/${id}/comments`, { text }).then((r) => r.data.data);

// ── Conversations & Messages ─────────────────────────────────
export const getConversations = () => api.get('/conversations').then((r) => r.data.data);
export const getMessages = (conversationId: string, page = 1) =>
  api.get(`/conversations/${conversationId}/messages`, { params: { page } }).then((r) => r.data.data);
export const sendMessageREST = (data: object) => api.post('/messages', data).then((r) => r.data.data);
export const markMessageRead = (id: string) => api.put(`/messages/${id}/read`).then((r) => r.data.data);

// ── Signal Keys ──────────────────────────────────────────────
export const getPublicKeys = (userId: string) => api.get(`/keys/${userId}`).then((r) => r.data.data);
export const uploadPreKeys = (data: object) => api.post('/keys/prekeys', data).then((r) => r.data.data);

export default api;
