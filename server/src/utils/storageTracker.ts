import { User } from '../models/User';

export async function checkStorageLimit(userId: string, fileSize: number): Promise<boolean> {
  const user = await User.findById(userId).select('storageUsed storageLimit');
  if (!user) return false;
  return user.storageUsed + fileSize <= user.storageLimit;
}

export async function incrementStorage(userId: string, fileSize: number): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { storageUsed: fileSize } });
}

export async function decrementStorage(userId: string, fileSize: number): Promise<void> {
  await User.findByIdAndUpdate(userId, { $inc: { storageUsed: -fileSize } });
}
