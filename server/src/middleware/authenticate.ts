import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: { id: string; email: string; name: string };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.access_token as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');

    const payload = jwt.verify(token, secret) as { userId: string; email: string; name: string };
    req.userId = payload.userId;
    req.user = { id: payload.userId, email: payload.email, name: payload.name };

    // Verify user still exists
    const user = await User.findById(payload.userId).select('_id');
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
