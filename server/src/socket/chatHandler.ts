import { Server, Socket } from 'socket.io';
import Message from '../models/Message';
import Conversation from '../models/Conversation';

export const chatHandler = (io: Server, socket: Socket): void => {
  const userId = socket.data.userId;

  socket.on('message:send', async (data) => {
    try {
      const { conversationId, ciphertext, messageType, type, photoUrl } = data;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) return;

      const message = await Message.create({
        conversationId,
        senderId: userId,
        type: type || 'text',
        ciphertext,
        messageType,
        photoUrl: photoUrl || null,
        timestamp: new Date(),
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
          ciphertext,
          timestamp: message.timestamp,
        },
      });

      const populated = await message.populate('senderId', 'displayName profilePhotoUrl');

      socket.emit('message:sent', {
        messageId: message._id,
        timestamp: message.timestamp,
      });

      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId
      );

      if (otherParticipant) {
        io.to(`user:${otherParticipant.toString()}`).emit('message:receive', {
          message: populated,
        });
      }
    } catch (error) {
      console.error('Message send error:', error);
    }
  });

  socket.on('typing:start', (data) => {
    const { conversationId } = data;
    socket.broadcast.emit('typing:start', { conversationId, userId });
  });

  socket.on('typing:stop', (data) => {
    const { conversationId } = data;
    socket.broadcast.emit('typing:stop', { conversationId, userId });
  });
};
