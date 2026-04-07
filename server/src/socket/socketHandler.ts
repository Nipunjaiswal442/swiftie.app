import { Server, Socket } from 'socket.io';
import { verifyJWT } from '../utils/jwt';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { Conversation, buildConversationId } from '../models/Conversation';

/** Map of userId → socket.id for online presence */
const onlineUsers = new Map<string, string>();

interface SendMessagePayload {
  recipientId: string;
  ciphertext: string;
  messageType?: 'text' | 'image';
  senderRatchetKey?: string;
  messageNumber?: number;
  previousChainLength?: number;
  encryptedMediaUrl?: string;
}

export function initSocketHandler(io: Server): void {
  // ── Auth middleware on every socket connection ──────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyJWT(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId: string = socket.data.user.userId;
    onlineUsers.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user:online', { userId });

    console.log(`[socket] ${userId} connected (${socket.id})`);

    // ── message:send ─────────────────────────────────────────
    socket.on('message:send', async (payload: SendMessagePayload) => {
      try {
        const { recipientId, ciphertext, messageType, senderRatchetKey, messageNumber, previousChainLength, encryptedMediaUrl } = payload;
        if (!recipientId || !ciphertext) return;

        const conversationId = buildConversationId(userId, recipientId);

        // Persist encrypted message — server never sees plaintext
        const message = await Message.create({
          conversationId,
          sender: userId,
          recipient: recipientId,
          ciphertext,
          messageType: messageType || 'text',
          senderRatchetKey: senderRatchetKey || '',
          messageNumber: messageNumber || 0,
          previousChainLength: previousChainLength || 0,
          encryptedMediaUrl: encryptedMediaUrl || '',
          deliveredAt: null,
          readAt: null,
        });

        // Upsert conversation
        await Conversation.findOneAndUpdate(
          { conversationId },
          {
            $setOnInsert: { participants: [userId, recipientId], conversationId },
            $set: { lastMessage: { ciphertext, sender: userId, timestamp: message.timestamp } },
            $inc: { [`unreadCount.${recipientId}`]: 1 },
          },
          { upsert: true, new: true }
        );

        // Deliver to recipient if online
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:receive', {
            messageId: message._id,
            conversationId,
            senderId: userId,
            ciphertext,
            messageType: message.messageType,
            senderRatchetKey: message.senderRatchetKey,
            messageNumber: message.messageNumber,
            previousChainLength: message.previousChainLength,
            encryptedMediaUrl: message.encryptedMediaUrl,
            timestamp: message.timestamp,
          });

          // Mark as delivered immediately if recipient is online
          await Message.findByIdAndUpdate(message._id, { deliveredAt: new Date() });
          socket.emit('message:delivered', { messageId: message._id });
        }

        // Acknowledge to sender
        socket.emit('message:sent', { messageId: message._id, conversationId, timestamp: message.timestamp });
      } catch (err) {
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // ── message:read ─────────────────────────────────────────
    socket.on('message:read', async ({ messageId }: { messageId: string }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { readAt: new Date() },
          { new: true }
        );
        if (!message) return;

        const senderSocketId = onlineUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:read', { messageId });
        }
      } catch { /* ignore */ }
    });

    // ── typing indicators ─────────────────────────────────────
    socket.on('typing:start', ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:start', { conversationId, senderId: userId });
      }
    });

    socket.on('typing:stop', ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stop', { conversationId, senderId: userId });
      }
    });

    // ── disconnect ───────────────────────────────────────────
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user:offline', { userId });
      console.log(`[socket] ${userId} disconnected`);
    });
  });
}
