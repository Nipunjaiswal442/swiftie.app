import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, bio, profilePhotoUrl, storageUsedBytes } = req.body;
    const update: Record<string, unknown> = {};

    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (profilePhotoUrl !== undefined) update.profilePhotoUrl = profilePhotoUrl;
    if (storageUsedBytes !== undefined) update.storageUsedBytes = storageUsedBytes;

    const user = await User.findByIdAndUpdate(req.user!.userId, update, { new: true });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      res.json({ users: [] });
      return;
    }

    const users = await User.find(
      { $text: { $search: query }, _id: { $ne: req.user!.userId } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .select('displayName email profilePhotoUrl bio');

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select(
      'displayName email profilePhotoUrl bio createdAt'
    );
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
