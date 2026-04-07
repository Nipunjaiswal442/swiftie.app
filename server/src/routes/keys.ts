import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';

export const keysRouter = Router();
keysRouter.use(authMiddleware);

/**
 * GET /api/v1/keys/:userId
 * Returns the Signal public key bundle for initiating an X3DH session.
 * Consumes one one-time pre-key per request.
 */
keysRouter.get('/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.userId)
      .select('signalIdentityKey signalSignedPreKey signalPreKeys');
    if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }

    // Pop one one-time pre-key
    const preKey = user.signalPreKeys.shift();
    if (preKey) await user.save();

    res.json({
      success: true,
      data: {
        identityKey: user.signalIdentityKey,
        signedPreKey: user.signalSignedPreKey,
        oneTimePreKey: preKey || null,
        remainingPreKeys: user.signalPreKeys.length,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch keys' });
  }
});

/**
 * POST /api/v1/keys/prekeys
 * Upload identity key, signed pre-key, and batch of one-time pre-keys.
 */
keysRouter.post('/prekeys', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { identityKey, signedPreKey, preKeys } = req.body as {
      identityKey?: string;
      signedPreKey?: { keyId: number; publicKey: string; signature: string };
      preKeys?: Array<{ keyId: number; publicKey: string }>;
    };

    const update: Record<string, unknown> = {};
    if (identityKey) update['signalIdentityKey'] = identityKey;
    if (signedPreKey) update['signalSignedPreKey'] = signedPreKey;

    const updatedUser = await User.findByIdAndUpdate(
      req.user!.userId,
      {
        ...(Object.keys(update).length ? { $set: update } : {}),
        ...(preKeys?.length ? { $push: { signalPreKeys: { $each: preKeys } } } : {}),
      },
      { new: true }
    ).select('signalIdentityKey signalSignedPreKey signalPreKeys');

    res.json({
      success: true,
      data: { uploadedPreKeys: preKeys?.length || 0, remainingPreKeys: updatedUser?.signalPreKeys.length || 0 },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to upload keys' });
  }
});
