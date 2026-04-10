import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../services/messageService';
import { signalManager } from '../crypto/SignalManager';
import { Message } from '../types/message';

export const useChat = (conversationId: string, otherUserId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const decryptMessages = useCallback(
    async (msgs: Message[]): Promise<Message[]> => {
      const decrypted: Message[] = [];
      for (const msg of msgs) {
        try {
          const senderId =
            typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
          const plaintext = await signalManager.decryptMessage(
            senderId,
            msg.ciphertext,
            msg.messageType
          );
          decrypted.push({ ...msg, plaintext });
        } catch {
          decrypted.push({ ...msg, plaintext: '[Unable to decrypt]' });
        }
      }
      return decrypted;
    },
    []
  );

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await getMessages(conversationId);
        const decrypted = await decryptMessages(data.messages);
        setMessages(decrypted);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
      setLoading(false);
    };
    loadMessages();
  }, [conversationId, decryptMessages]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = async (data: { message: Message }) => {
      if (data.message.conversationId === conversationId) {
        try {
          const senderId =
            typeof data.message.senderId === 'string'
              ? data.message.senderId
              : data.message.senderId._id;
          const plaintext = await signalManager.decryptMessage(
            senderId,
            data.message.ciphertext,
            data.message.messageType
          );
          setMessages((prev) => [...prev, { ...data.message, plaintext }]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { ...data.message, plaintext: '[Unable to decrypt]' },
          ]);
        }
      }
    };

    const handleTypingStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTyping(true);
      }
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTyping(false);
      }
    };

    socket.on('message:receive', handleReceive);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:receive', handleReceive);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, conversationId, user]);

  const sendMessage = useCallback(
    async (text: string, type: 'text' | 'image' = 'text', photoUrl?: string) => {
      if (!socket) return;

      try {
        const encrypted = await signalManager.encryptMessage(otherUserId, text);
        socket.emit('message:send', {
          conversationId,
          ciphertext: encrypted.ciphertext,
          messageType: encrypted.messageType,
          type,
          photoUrl,
        });

        const newMsg: Message = {
          _id: Date.now().toString(),
          conversationId,
          senderId: user!._id,
          type,
          ciphertext: encrypted.ciphertext,
          messageType: encrypted.messageType,
          photoUrl: photoUrl || null,
          timestamp: new Date().toISOString(),
          plaintext: text,
        };
        setMessages((prev) => [...prev, newMsg]);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [socket, conversationId, otherUserId, user]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket) return;
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });

      if (isTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing:stop', { conversationId });
        }, 3000);
      }
    },
    [socket, conversationId]
  );

  return { messages, loading, typing, sendMessage, sendTyping };
};
