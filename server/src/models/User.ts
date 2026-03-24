import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  bio: string;
  profilePhotoUrl: string;
  storageUsedBytes: number;
  registrationId: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    displayName: { type: String, default: '' },
    bio: { type: String, default: '' },
    profilePhotoUrl: { type: String, default: '' },
    storageUsedBytes: { type: Number, default: 0 },
    registrationId: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ displayName: 'text', email: 'text' });

export default mongoose.model<IUser>('User', userSchema);
