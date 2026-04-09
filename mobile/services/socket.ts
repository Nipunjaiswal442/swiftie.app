import { io, Socket } from 'socket.io-client';
import { storage, TOKEN_KEY } from './api';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://swiftie-backend.onrender.com';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  const token = await storage.get(TOKEN_KEY);
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

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

// ── Emit helpers ────────────────────────────────────────────
export function sendMessage(payload: object): void {
  socket?.emit('message:send', payload);
}

export function sendTypingStart(conversationId: string, recipientId: string): void {
  socket?.emit('typing:start', { conversationId, recipientId });
}

export function sendTypingStop(conversationId: string, recipientId: string): void {
  socket?.emit('typing:stop', { conversationId, recipientId });
}

export function markRead(messageId: string): void {
  socket?.emit('message:read', { messageId });
}

// ── Listener helpers ─────────────────────────────────────────
export function onMessageReceive(handler: (msg: any) => void): () => void {
  socket?.on('message:receive', handler);
  return () => { socket?.off('message:receive', handler); };
}

export function onTypingStart(handler: (data: any) => void): () => void {
  socket?.on('typing:start', handler);
  return () => { socket?.off('typing:start', handler); };
}

export function onTypingStop(handler: (data: any) => void): () => void {
  socket?.on('typing:stop', handler);
  return () => { socket?.off('typing:stop', handler); };
}

export function onUserOnline(handler: (data: any) => void): () => void {
  socket?.on('user:online', handler);
  return () => { socket?.off('user:online', handler); };
}

export function onUserOffline(handler: (data: any) => void): () => void {
  socket?.on('user:offline', handler);
  return () => { socket?.off('user:offline', handler); };
}

export function onMessageDelivered(handler: (data: any) => void): () => void {
  socket?.on('message:delivered', handler);
  return () => { socket?.off('message:delivered', handler); };
}

export function onMessageRead(handler: (data: any) => void): () => void {
  socket?.on('message:read', handler);
  return () => { socket?.off('message:read', handler); };
}
