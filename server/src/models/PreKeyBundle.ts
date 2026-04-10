import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPreKeyBundle extends Document {
  userId: Types.ObjectId;
  registrationId: number;
  identityKey: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKeys: Array<{
    keyId: number;
    publicKey: string;
  }>;
  updatedAt: Date;
}

const preKeyBundleSchema = new Schema<IPreKeyBundle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registrationId: { type: Number, required: true },
    identityKey: { type: String, required: true },
    signedPreKey: {
      keyId: { type: Number, required: true },
      publicKey: { type: String, required: true },
      signature: { type: String, required: true },
    },
    oneTimePreKeys: [
      {
        keyId: { type: Number, required: true },
        publicKey: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

preKeyBundleSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model<IPreKeyBundle>('PreKeyBundle', preKeyBundleSchema);
