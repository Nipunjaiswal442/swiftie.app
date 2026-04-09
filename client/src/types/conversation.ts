import { User } from './user';

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage: {
    ciphertext: string;
    timestamp: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
