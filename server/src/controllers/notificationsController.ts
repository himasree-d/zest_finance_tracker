import { Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { RecurringBill } from '../models/RecurringBill';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

export async function getNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications.map(n => ({ id: n._id.toString(), type: n.type, title: n.title, message: n.message, read: n.read, data: n.data, createdAt: n.createdAt })));
}

export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const notification = await Notification.findById(id);
  if (!notification || notification.userId.toString() !== userId) throw new HttpError('Not found', 404);

  const updated = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
  if (!updated) throw new HttpError('Not found', 404);
  res.json({ id: updated._id.toString(), type: updated.type, title: updated.title, message: updated.message, read: updated.read, data: updated.data, createdAt: updated.createdAt });
}

export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  await Notification.updateMany({ userId, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
}

export async function deleteNotification(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const notification = await Notification.findById(id);
  if (!notification || notification.userId.toString() !== userId) throw new HttpError('Not found', 404);

  await Notification.findByIdAndDelete(id);
  res.json({ message: 'Deleted' });
}

export async function clearAll(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  await Notification.deleteMany({ userId });
  res.json({ message: 'All notifications cleared' });
}

export async function generateBillDueNotifications(userId: string): Promise<void> {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const upcomingBills = await RecurringBill.find({
    userId: userObjId, isActive: true, nextDueDate: { $gte: now, $lte: in3Days },
  });

  for (const bill of upcomingBills) {
    const daysUntilDue = Math.ceil((bill.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dueDateStr = bill.nextDueDate.toISOString().split('T')[0];
    const message = `Your ${bill.name} bill is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} days`}.`;

    const existing = await Notification.findOne({
      userId: userObjId, type: 'BILL_DUE',
      'data.billId': bill._id.toString(), 'data.dueDate': dueDateStr,
    });

    if (!existing) {
      await Notification.create({
        userId: userObjId, type: 'BILL_DUE', title: 'Bill Due Soon', message,
        data: { billId: bill._id.toString(), dueDate: dueDateStr },
      });
    }
  }
}
