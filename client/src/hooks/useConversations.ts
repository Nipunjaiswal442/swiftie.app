import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { getConversations } from '../services/conversationService';
import { Conversation } from '../types/conversation';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      fetchConversations();
    };

    socket.on('message:receive', handleNewMessage);
    return () => {
      socket.off('message:receive', handleNewMessage);
    };
  }, [socket, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
};
