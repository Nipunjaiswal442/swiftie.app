import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  mongoose.connection.on('connected', () => console.log('[mongo] connected'));
  mongoose.connection.on('error', (err) => console.error('[mongo] error:', err));
  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
}
