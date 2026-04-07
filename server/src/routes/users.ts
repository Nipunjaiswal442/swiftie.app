import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export const usersRouter = Router();
usersRouter.use(authMiddleware);

/** GET /api/v1/users/me */
usersRouter.get('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('-signalPreKeys');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

/** PUT /api/v1/users/me */
usersRouter.put('/me', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { displayName, bio, username, profilePhotoUrl, coverPhotoUrl } = req.body as {
      displayName?: string; bio?: string; username?: string;
      profilePhotoUrl?: string; coverPhotoUrl?: string;
    };

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user!.userId } });
      if (existing) { res.status(409).json({ success: false, error: 'Username already taken' }); return; }
    }

    const updated = await User.findByIdAndUpdate(
      req.user!.userId,
      { $set: { displayName, bio, username, profilePhotoUrl, coverPhotoUrl } },
      { new: true, runValidators: true }
    ).select('-signalPreKeys');

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/** GET /api/v1/users/search?q= */
usersRouter.get('/search', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      _id: { $ne: req.user!.userId },
      $or: [{ displayName: regex }, { username: regex }],
    }).select('displayName username profilePhotoUrl bio followers').limit(20);
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

/** GET /api/v1/users/:id */
usersRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-signalPreKeys');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

/** POST /api/v1/users/:id/follow */
usersRouter.post('/:id/follow', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetId = req.params.id;
    const myId = req.user!.userId;
    if (targetId === myId) { res.status(400).json({ success: false, error: 'Cannot follow yourself' }); return; }

    await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
    res.json({ success: true, data: { following: true } });
  } catch {
    res.status(500).json({ success: false, error: 'Follow failed' });
  }
});

/** DELETE /api/v1/users/:id/follow */
usersRouter.delete('/:id/follow', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetId = req.params.id;
    const myId = req.user!.userId;
    await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
    res.json({ success: true, data: { following: false } });
  } catch {
    res.status(500).json({ success: false, error: 'Unfollow failed' });
  }
});
