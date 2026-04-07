import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  firebaseUid: string;
  email: string;
}

export function signJWT(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRY || '7d' } as jwt.SignOptions);
}

export function verifyJWT(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, secret) as JWTPayload;
}
