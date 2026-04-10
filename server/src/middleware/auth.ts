import { Response, NextFunction } from 'express';
import { admin } from '../config/firebase';
import User from '../models/User';
import { AuthRequest } from '../types';

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      userId: user._id.toString(),
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
