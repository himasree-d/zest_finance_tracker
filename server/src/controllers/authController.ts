import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { registerSchema, loginSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(userId: string, email: string, name: string): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not set');
  return jwt.sign({ userId, email, name }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  // In production (Vercel -> Render), domains are different, so sameSite must be 'none' and secure must be true.
  // Locally, domains are the same (thanks to Vite proxy), so sameSite 'lax' and secure false works perfectly.
  res.cookie('access_token', accessToken, {
    httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS, path: '/api/auth/refresh',
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: body.email.toLowerCase() });
  if (existing) throw new HttpError('Email already in use', 409);

  const hashed = await bcrypt.hash(body.password, SALT_ROUNDS);
  const user = await User.create({ name: body.name, email: body.email, password: hashed });

  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId, user.email, user.name);
  const refreshToken = generateRefreshToken(userId);

  await RefreshToken.deleteMany({ userId: user._id });
  await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS) });

  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ user: { id: userId, email: user.email, name: user.name, avatar: user.avatar, createdAt: user.createdAt } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);

  const user = await User.findOne({ email: body.email.toLowerCase() });
  if (!user) throw new HttpError('Invalid credentials', 401);

  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) throw new HttpError('Invalid credentials', 401);

  const userId = user._id.toString();
  const accessToken = generateAccessToken(userId, user.email, user.name);
  const refreshToken = generateRefreshToken(userId);

  await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS) });

  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user: { id: userId, email: user.email, name: user.name, avatar: user.avatar, createdAt: user.createdAt } });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies.refresh_token as string | undefined;
  if (!token) throw new HttpError('Refresh token required', 401);

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');

  let payload: { userId: string };
  try {
    payload = jwt.verify(token, secret) as { userId: string };
  } catch {
    throw new HttpError('Invalid or expired refresh token', 401);
  }

  const storedToken = await RefreshToken.findOne({ token });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new HttpError('Refresh token expired or revoked', 401);
  }

  await RefreshToken.deleteOne({ token });

  const user = await User.findById(payload.userId);
  if (!user) throw new HttpError('User not found', 401);

  const userId = user._id.toString();
  const newAccessToken = generateAccessToken(userId, user.email, user.name);
  const newRefreshToken = generateRefreshToken(userId);

  await RefreshToken.create({ token: newRefreshToken, userId: user._id, expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS) });

  setAuthCookies(res, newAccessToken, newRefreshToken);
  res.json({ message: 'Token refreshed' });
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  const token = req.cookies.refresh_token as string | undefined;
  if (token) await RefreshToken.deleteMany({ token });

  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select('-password');
  if (!user) throw new HttpError('User not found', 404);
  res.json({ user: { id: user._id.toString(), email: user.email, name: user.name, avatar: user.avatar, createdAt: user.createdAt } });
}
