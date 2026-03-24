import { User } from './user';

export interface Message {
  _id: string;
  conversationId: string;
  senderId: User | string;
  type: 'text' | 'image';
  ciphertext: string;
  messageType: number;
  photoUrl: string | null;
  timestamp: string;
  plaintext?: string;
}
