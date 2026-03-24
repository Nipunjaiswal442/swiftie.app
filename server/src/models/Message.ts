import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: 'text' | 'image';
  ciphertext: string;
  messageType: number;
  photoUrl: string | null;
  timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  ciphertext: { type: String, required: true },
  messageType: { type: Number, required: true },
  photoUrl: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ conversationId: 1, timestamp: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
