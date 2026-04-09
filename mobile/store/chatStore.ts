import { create } from 'zustand';
import { getConversations, getMessages } from '../services/api';

interface Participant {
  _id: string;
  displayName: string;
  username: string;
  profilePhotoUrl?: string;
  isOnline?: boolean;
}

interface Conversation {
  _id: string;
  conversationId: string;
  participants: Participant[];
  lastMessage?: {
    ciphertext: string;
    timestamp: string;
  };
  unreadCount?: Record<string, number>;
}

interface Message {
  _id: string;
  sender: string;
  ciphertext: string;
  timestamp: string;
  conversationId?: string;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  decryptedCache: Record<string, string>;
  isLoadingConversations: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  addMessage: (conversationId: string, msg: Message) => void;
  cacheDecrypted: (msgId: string, plaintext: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messages: {},
  decryptedCache: {},
  isLoadingConversations: false,

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const data = await getConversations();
      set({ conversations: data });
    } catch (err) {
      console.error('fetchConversations failed', err);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: data },
      }));
    } catch (err) {
      console.error('fetchMessages failed', err);
    }
  },

  addMessage: (conversationId: string, msg: Message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), msg],
      },
    }));
  },

  cacheDecrypted: (msgId: string, plaintext: string) => {
    set((state) => ({
      decryptedCache: { ...state.decryptedCache, [msgId]: plaintext },
    }));
  },
}));
