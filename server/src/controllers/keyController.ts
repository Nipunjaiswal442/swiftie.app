import { Response } from 'express';
import PreKeyBundle from '../models/PreKeyBundle';
import User from '../models/User';
import { AuthRequest } from '../types';
import { getIO } from '../config/socket';

export const uploadBundle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { registrationId, identityKey, signedPreKey, oneTimePreKeys } = req.body;
    const userId = req.user!.userId;

    await User.findByIdAndUpdate(userId, { registrationId });

    await PreKeyBundle.findOneAndUpdate(
      { userId },
      { registrationId, identityKey, signedPreKey, oneTimePreKeys },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBundle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const bundle = await PreKeyBundle.findOne({ userId });
    if (!bundle) {
      res.status(404).json({ error: 'Pre-key bundle not found' });
      return;
    }

    let oneTimePreKey = null;
    if (bundle.oneTimePreKeys.length > 0) {
      oneTimePreKey = bundle.oneTimePreKeys[0];

      await PreKeyBundle.findByIdAndUpdate(bundle._id, {
        $pop: { oneTimePreKeys: -1 },
      });

      if (bundle.oneTimePreKeys.length <= 10) {
        const io = getIO();
        io.to(`user:${userId}`).emit('keys:low', {
          remaining: bundle.oneTimePreKeys.length - 1,
        });
      }
    }

    res.json({
      registrationId: bundle.registrationId,
      identityKey: bundle.identityKey,
      signedPreKey: bundle.signedPreKey,
      oneTimePreKey,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const replenishKeys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oneTimePreKeys } = req.body;
    const userId = req.user!.userId;

    await PreKeyBundle.findOneAndUpdate(
      { userId },
      { $push: { oneTimePreKeys: { $each: oneTimePreKeys } } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
