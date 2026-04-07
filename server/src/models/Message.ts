import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: string;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  ciphertext: string;
  messageType: 'text' | 'image';
  encryptedMediaUrl: string;
  senderRatchetKey: string;
  messageNumber: number;
  previousChainLength: number;
  timestamp: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
  isDeleted: boolean;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Server stores ONLY ciphertext — never plaintext
    ciphertext: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image'], default: 'text' },
    encryptedMediaUrl: { type: String, default: '' },
    senderRatchetKey: { type: String, default: '' },
    messageNumber: { type: Number, default: 0 },
    previousChainLength: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now, index: true },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: false }
);

MessageSchema.index({ conversationId: 1, timestamp: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
