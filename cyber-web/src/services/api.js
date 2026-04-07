import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('swiftie_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — clear token and reload to landing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('swiftie_token');
      localStorage.removeItem('swiftie_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────
export const exchangeFirebaseToken = (idToken) =>
  api.post('/auth/firebase', { idToken }).then((r) => r.data.data);

// ── Users ───────────────────────────────────────────────────
export const getMe = () => api.get('/users/me').then((r) => r.data.data);
export const updateMe = (data) => api.put('/users/me', data).then((r) => r.data.data);
export const getUserById = (id) => api.get(`/users/${id}`).then((r) => r.data.data);
export const searchUsers = (q = '') => api.get('/users/search', { params: { q } }).then((r) => r.data.data);
export const followUser = (id) => api.post(`/users/${id}/follow`).then((r) => r.data.data);
export const unfollowUser = (id) => api.delete(`/users/${id}/follow`).then((r) => r.data.data);

// ── Posts ───────────────────────────────────────────────────
export const getFeed = (page = 1) => api.get('/feed', { params: { page } }).then((r) => r.data.data);
export const createPost = (data) => api.post('/posts', data).then((r) => r.data.data);
export const getPost = (id) => api.get(`/posts/${id}`).then((r) => r.data.data);
export const deletePost = (id) => api.delete(`/posts/${id}`).then((r) => r.data.data);
export const likePost = (id) => api.post(`/posts/${id}/like`).then((r) => r.data.data);
export const unlikePost = (id) => api.delete(`/posts/${id}/like`).then((r) => r.data.data);
export const addComment = (id, text) => api.post(`/posts/${id}/comments`, { text }).then((r) => r.data.data);

// ── Conversations & Messages ─────────────────────────────────
export const getConversations = () => api.get('/conversations').then((r) => r.data.data);
export const getMessages = (conversationId, page = 1) =>
  api.get(`/conversations/${conversationId}/messages`, { params: { page } }).then((r) => r.data.data);
export const sendMessageREST = (data) => api.post('/messages', data).then((r) => r.data.data);
export const markMessageRead = (id) => api.put(`/messages/${id}/read`).then((r) => r.data.data);

// ── Signal Keys ──────────────────────────────────────────────
export const getPublicKeys = (userId) => api.get(`/keys/${userId}`).then((r) => r.data.data);
export const uploadPreKeys = (data) => api.post('/keys/prekeys', data).then((r) => r.data.data);

export default api;
