import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  lastMessage: {
    ciphertext: string;
    timestamp: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
      ciphertext: { type: String },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export default mongoose.model<IConversation>('Conversation', conversationSchema);
