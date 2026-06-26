import { Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { SavingsPot } from '../models/SavingsPot';
import { RecurringBill } from '../models/RecurringBill';
import { settingsSchema, profileSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.userId).select('-password');
  if (!user) throw new HttpError('User not found', 404);
  res.json({
    user: { id: user._id.toString(), email: user.email, name: user.name, avatar: user.avatar },
    settings: user.settings,
  });
}

export async function updateSettings(req: AuthRequest, res: Response): Promise<void> {
  const body = settingsSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { 'settings.currency': body.currency, 'settings.theme': body.theme, 'settings.emailNotifications': body.emailNotifications } },
    { new: true }
  );
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.settings);
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const body = profileSchema.parse(req.body);
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError('User not found', 404);

  const dataToUpdate: Record<string, unknown> = {};
  if (body.name) dataToUpdate.name = body.name;
  if (body.email) dataToUpdate.email = body.email;
  if (body.avatar !== undefined) dataToUpdate.avatar = body.avatar;

  if (body.newPassword) {
    if (!body.currentPassword) throw new HttpError('Current password required', 400);
    const valid = await bcrypt.compare(body.currentPassword, user.password);
    if (!valid) throw new HttpError('Invalid current password', 401);
    dataToUpdate.password = await bcrypt.hash(body.newPassword, 12);
  }

  const updated = await User.findByIdAndUpdate(req.userId, dataToUpdate, { new: true }).select('-password');
  if (!updated) throw new HttpError('User not found', 404);
  res.json({ id: updated._id.toString(), email: updated.email, name: updated.name, avatar: updated.avatar });
}

export async function exportData(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);

  const [transactions, budgets, pots, bills] = await Promise.all([
    Transaction.find({ userId }),
    Budget.find({ userId }),
    SavingsPot.find({ userId }),
    RecurringBill.find({ userId }),
  ]);

  const data = { exportDate: new Date(), transactions, budgets, pots, bills };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="zest-data.json"');
  res.send(JSON.stringify(data, null, 2));
}

export async function deleteAccount(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);

  await Promise.all([
    User.findByIdAndDelete(userId),
    Transaction.deleteMany({ userId }),
    Budget.deleteMany({ userId }),
    SavingsPot.deleteMany({ userId }),
    RecurringBill.deleteMany({ userId }),
  ]);

  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ message: 'Account deleted' });
}
