import { Response } from 'express';
import mongoose from 'mongoose';
import { RecurringBill } from '../models/RecurringBill';
import { Transaction } from '../models/Transaction';
import { recurringBillSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';
import { generateBillDueNotifications } from './notificationsController';

export async function getBills(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const now = new Date();

  await generateBillDueNotifications(req.userId!).catch(console.error);

  const bills = await RecurringBill.find({ userId, isActive: true }).sort({ nextDueDate: 1 });

  const billsWithStatus = bills.map(b => {
    let status = 'UPCOMING';
    const nextDue = new Date(b.nextDueDate);
    const lastPaid = b.lastPaidDate ? new Date(b.lastPaidDate) : null;
    const diffMs = nextDue.getTime() - now.getTime();
    const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (lastPaid && lastPaid.getMonth() === now.getMonth() && lastPaid.getFullYear() === now.getFullYear() && b.frequency === 'MONTHLY') {
      status = 'PAID';
    } else if (daysUntilDue < 0) {
      status = 'OVERDUE';
    } else if (daysUntilDue <= 5) {
      status = 'DUE_SOON';
    }

    return { id: b._id.toString(), name: b.name, amount: b.amount, category: b.category, frequency: b.frequency, nextDueDate: b.nextDueDate, lastPaidDate: b.lastPaidDate, icon: b.icon, color: b.color, isActive: b.isActive, status, daysUntilDue };
  });

  res.json(billsWithStatus);
}

export async function createBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const body = recurringBillSchema.parse(req.body);
  const bill = await RecurringBill.create({ ...body, userId, nextDueDate: new Date(body.nextDueDate) });
  res.status(201).json({ id: bill._id.toString(), ...body, nextDueDate: bill.nextDueDate, isActive: bill.isActive });
}

export async function updateBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;
  const body = recurringBillSchema.partial().parse(req.body);

  const existing = await RecurringBill.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Bill not found', 404);

  const updates: Record<string, unknown> = { ...body };
  if (body.nextDueDate) updates.nextDueDate = new Date(body.nextDueDate);

  const updated = await RecurringBill.findByIdAndUpdate(id, updates, { new: true });
  if (!updated) throw new HttpError('Bill not found', 404);
  res.json({ id: updated._id.toString(), name: updated.name, amount: updated.amount, category: updated.category, frequency: updated.frequency, nextDueDate: updated.nextDueDate, icon: updated.icon, color: updated.color, isActive: updated.isActive });
}

export async function deleteBill(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await RecurringBill.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Bill not found', 404);

  await RecurringBill.findByIdAndDelete(id);
  res.json({ message: 'Bill deleted' });
}

export async function markBillPaid(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const bill = await RecurringBill.findById(id);
  if (!bill || bill.userId.toString() !== userId) throw new HttpError('Bill not found', 404);

  const now = new Date();
  const newNextDue = new Date(bill.nextDueDate);
  if (bill.frequency === 'MONTHLY') newNextDue.setMonth(newNextDue.getMonth() + 1);
  else if (bill.frequency === 'WEEKLY') newNextDue.setDate(newNextDue.getDate() + 7);
  else if (bill.frequency === 'YEARLY') newNextDue.setFullYear(newNextDue.getFullYear() + 1);

  const [updated] = await Promise.all([
    RecurringBill.findByIdAndUpdate(id, { lastPaidDate: now, nextDueDate: newNextDue }, { new: true }),
    Transaction.create({
      userId: new mongoose.Types.ObjectId(userId), name: bill.name, amount: bill.amount,
      type: 'EXPENSE', category: bill.category, date: now, note: `Auto: ${bill.name} bill paid`,
    }),
  ]);

  if (!updated) throw new HttpError('Bill not found', 404);
  res.json({ id: updated._id.toString(), name: updated.name, amount: updated.amount, nextDueDate: updated.nextDueDate, lastPaidDate: updated.lastPaidDate });
}
