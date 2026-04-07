import mongoose, { Document, Schema } from 'mongoose';

export interface ILastMessage {
  ciphertext: string;
  sender: mongoose.Types.ObjectId;
  timestamp: Date;
}

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  conversationId: string;
  lastMessage: ILastMessage;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (v: mongoose.Types.ObjectId[]) => v.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
      index: true,
    },
    conversationId: { type: String, required: true, unique: true, index: true },
    lastMessage: {
      ciphertext: { type: String, default: '' },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
    },
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

/** Generates a deterministic conversation ID from two user IDs */
export function buildConversationId(
  userA: string,
  userB: string
): string {
  return [userA, userB].sort().join('_');
}

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
