import mongoose, { Document, Schema } from 'mongoose';

export interface ISignedPreKey {
  keyId: number;
  publicKey: string;
  signature: string;
}

export interface IPreKey {
  keyId: number;
  publicKey: string;
}

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  postsCount: number;
  storageUsed: number;
  storageLimit: number;
  signalIdentityKey: string;
  signalSignedPreKey: ISignedPreKey;
  signalPreKeys: IPreKey[];
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    bio: { type: String, default: '', maxlength: 160 },
    profilePhotoUrl: { type: String, default: '' },
    coverPhotoUrl: { type: String, default: '' },
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    postsCount: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    storageLimit: { type: Number, default: 104_857_600 }, // 100 MB
    signalIdentityKey: { type: String, default: '' },
    signalSignedPreKey: {
      keyId: { type: Number },
      publicKey: { type: String },
      signature: { type: String },
    },
    signalPreKeys: [{ keyId: { type: Number }, publicKey: { type: String } }],
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
