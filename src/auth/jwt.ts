import jwt from 'jsonwebtoken';
import type { AuthContext, JwtPayload } from './types';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return secret;
}

export function signAuthToken(auth: AuthContext): string {
  const payload: JwtPayload = {
    sub: auth.userId,
    username: auth.username,
    roleCodes: auth.roleCodes,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '8h',
  });
}

export function verifyAuthToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload.');
  }

  const payload = decoded as JwtPayload;

  if (!payload.sub || !payload.username || !Array.isArray(payload.roleCodes)) {
    throw new Error('Invalid token payload.');
  }

  return payload;
}
