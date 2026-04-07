import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
const listeners = new Map();

export function connectSocket() {
  const token = localStorage.getItem('swiftie_token');
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('[socket] connected'));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[socket] error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}

// ── Emit helpers ────────────────────────────────────────────
export function sendMessage(payload) {
  socket?.emit('message:send', payload);
}

export function sendTypingStart(conversationId, recipientId) {
  socket?.emit('typing:start', { conversationId, recipientId });
}

export function sendTypingStop(conversationId, recipientId) {
  socket?.emit('typing:stop', { conversationId, recipientId });
}

export function markRead(messageId) {
  socket?.emit('message:read', { messageId });
}

// ── Listener helpers ─────────────────────────────────────────
export function onMessageReceive(handler) {
  const key = 'message:receive';
  socket?.on(key, handler);
  listeners.set(key, handler);
  return () => socket?.off(key, handler);
}

export function onTypingStart(handler) {
  socket?.on('typing:start', handler);
  return () => socket?.off('typing:start', handler);
}

export function onTypingStop(handler) {
  socket?.on('typing:stop', handler);
  return () => socket?.off('typing:stop', handler);
}

export function onUserOnline(handler) {
  socket?.on('user:online', handler);
  return () => socket?.off('user:online', handler);
}

export function onUserOffline(handler) {
  socket?.on('user:offline', handler);
  return () => socket?.off('user:offline', handler);
}

export function onMessageDelivered(handler) {
  socket?.on('message:delivered', handler);
  return () => socket?.off('message:delivered', handler);
}

export function onMessageRead(handler) {
  socket?.on('message:read', handler);
  return () => socket?.off('message:read', handler);
}
