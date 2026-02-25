import jwt from 'jsonwebtoken';

const FALLBACK_JWT_SECRET = 'development-only-secret';
const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === FALLBACK_JWT_SECRET) {
  throw new Error('[JWT] JWT_SECRET must be configured in production environments');
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    console.warn('[JWT] Token verification failed');
    return null;
  }
}
