import { Response } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { transactionSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.string().optional(),
  amountMax: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'name']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().default('1'),
  pageSize: z.string().default('10'),
});

export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('Invalid query parameters', 400);

  const { search, category, type, dateFrom, dateTo, amountMin, amountMax, sortBy, sortOrder, page, pageSize } = parsed.data;

  const filter: Record<string, unknown> = { userId };
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (dateFrom || dateTo) {
    filter.date = {
      ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { $lte: new Date(dateTo) } : {}),
    };
  }
  if (amountMin || amountMax) {
    filter.amount = {
      ...(amountMin ? { $gte: parseFloat(amountMin) } : {}),
      ...(amountMax ? { $lte: parseFloat(amountMax) } : {}),
    };
  }

  const sortField = sortBy === 'date' ? 'date' : sortBy === 'amount' ? 'amount' : 'name';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const pageNum = parseInt(page, 10);
  const size = Math.min(parseInt(pageSize, 10), 100);
  const skip = (pageNum - 1) * size;

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(size).populate('budgetId', 'name color icon'),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    data: transactions.map(t => ({
      id: t._id.toString(), name: t.name, amount: t.amount, type: t.type,
      category: t.category, date: t.date, note: t.note, merchant: t.merchant,
      budget: t.budgetId ? { name: (t.budgetId as any).name, color: (t.budgetId as any).color, icon: (t.budgetId as any).icon } : null,
    })),
    total, page: pageNum, pageSize: size, totalPages: Math.ceil(total / size),
  });
}

export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const body = transactionSchema.parse(req.body);

  const t = await Transaction.create({
    ...body, userId: new mongoose.Types.ObjectId(userId),
    amount: body.amount, date: new Date(body.date),
    budgetId: body.budgetId ? new mongoose.Types.ObjectId(body.budgetId) : undefined,
  });
  const populated = await t.populate('budgetId', 'name color icon');

  res.status(201).json({
    id: t._id.toString(), name: t.name, amount: t.amount, type: t.type,
    category: t.category, date: t.date, note: t.note, merchant: t.merchant,
    budget: populated.budgetId ? { name: (populated.budgetId as any).name, color: (populated.budgetId as any).color, icon: (populated.budgetId as any).icon } : null,
  });
}

export async function updateTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;
  const body = transactionSchema.partial().parse(req.body);

  const existing = await Transaction.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Transaction not found', 404);

  const updates: Record<string, unknown> = { ...body };
  if (body.date) updates.date = new Date(body.date);
  if (body.budgetId) updates.budgetId = new mongoose.Types.ObjectId(body.budgetId);

  const updated = await Transaction.findByIdAndUpdate(id, updates, { new: true }).populate('budgetId', 'name color icon');
  if (!updated) throw new HttpError('Transaction not found', 404);

  res.json({
    id: updated._id.toString(), name: updated.name, amount: updated.amount, type: updated.type,
    category: updated.category, date: updated.date, note: updated.note, merchant: updated.merchant,
    budget: updated.budgetId ? { name: (updated.budgetId as any).name, color: (updated.budgetId as any).color, icon: (updated.budgetId as any).icon } : null,
  });
}

export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await Transaction.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Transaction not found', 404);

  await Transaction.findByIdAndDelete(id);
  res.json({ message: 'Transaction deleted' });
}

export async function bulkDeleteTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) throw new HttpError('No IDs provided', 400);

  await Transaction.deleteMany({ _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }, userId: new mongoose.Types.ObjectId(userId) });
  res.json({ message: `Deleted ${ids.length} transactions` });
}
export async function bulkCreateTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const transactions = req.body;
  
  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new HttpError('Expected an array of transactions', 400);
  }

  const payload = transactions.map(t => ({
    userId: new mongoose.Types.ObjectId(userId),
    name: t.name,
    amount: t.amount,
    type: t.type,
    category: t.category || 'Other',
    date: new Date(t.date),
    merchant: t.merchant,
  }));

  const created = await Transaction.insertMany(payload);
  res.status(201).json({ message: `Created ${created.length} transactions`, count: created.length });
}


export async function exportTransactions(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError('Invalid query parameters', 400);

  const { category, type, dateFrom, dateTo } = parsed.data;
  const filter: Record<string, unknown> = { userId };
  if (category) filter.category = category;
  if (type) filter.type = type;
  if (dateFrom || dateTo) {
    filter.date = {
      ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { $lte: new Date(dateTo) } : {}),
    };
  }

  const [transactions, userDoc] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }),
    User.findById(userId).select('settings'),
  ]);

  const currency = userDoc?.settings?.currency ?? 'INR';
  const fmt = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);

  const header = 'Date,Name,Category,Type,Amount,Note,Merchant\n';
  const rows = transactions.map(t => [
    new Date(t.date).toISOString().split('T')[0],
    `"${t.name.replace(/"/g, '""')}"`,
    t.category, t.type,
    `"${fmt(t.amount)}"`,
    `"${(t.note ?? '').replace(/"/g, '""')}"`,
    `"${(t.merchant ?? '').replace(/"/g, '""')}"`,
  ].join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
  res.send(header + rows);
}
