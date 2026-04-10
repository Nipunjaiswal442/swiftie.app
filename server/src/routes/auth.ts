import { Router, Request, Response } from 'express';
import { verifyFirebaseToken } from '../config/firebase-admin';
import { User } from '../models/User';
import { signJWT } from '../utils/jwt';

export const authRouter = Router();

/**
 * POST /api/v1/auth/firebase
 * Body: { idToken: string }
 * Verifies Firebase ID token, upserts user in MongoDB, returns JWT.
 */
authRouter.post('/firebase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) {
      res.status(400).json({ success: false, error: 'idToken is required' });
      return;
    }

    // Verify the Firebase ID token
    let decoded;
    try {
      decoded = await verifyFirebaseToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      res.status(401).json({ 
        success: false, 
        error: 'Invalid Firebase token. Please ensure your Firebase Admin SDK is properly configured.' 
      });
      return;
    }

    // Upsert user record
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      const emailPrefix = (decoded.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const baseUsername = emailPrefix || 'user';
      let username = baseUsername;

      // Ensure unique username
      let attempt = 0;
      while (await User.exists({ username })) {
        attempt++;
        username = `${baseUsername}${attempt}`;
      }

      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email || '',
        username,
        displayName: decoded.name || username,
        profilePhotoUrl: decoded.picture || '',
      });
    }

    const token = signJWT({
      userId: (user._id as string).toString(),
      firebaseUid: user.firebaseUid,
      email: user.email,
    });

    res.json({ success: true, data: { token, user } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    console.error('Auth endpoint error:', err);
    res.status(401).json({ success: false, error: message });
  }
});
