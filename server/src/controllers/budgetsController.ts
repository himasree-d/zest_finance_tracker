import { Response } from 'express';
import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import { budgetSchema } from '../lib/schemas';
import { HttpError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/authenticate';

function getMonthRange(offset = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59);
  return { start, end };
}

export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const { start, end } = getMonthRange(0);

  const budgets = await Budget.find({ userId }).sort({ createdAt: 1 });
  if (budgets.length === 0) { res.json([]); return; }

  const budgetIds = budgets.map(b => b._id);

  const [spentAgg, allRecentTx] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId, type: 'EXPENSE', budgetId: { $in: budgetIds }, date: { $gte: start, $lte: end } } },
      { $group: { _id: '$budgetId', total: { $sum: '$amount' } } },
    ]),
    Transaction.find({ userId, budgetId: { $in: budgetIds } }).sort({ date: -1 }),
  ]);

  const spentMap = new Map(spentAgg.map(g => [g._id.toString(), g.total]));
  const txMap = new Map<string, any[]>();
  for (const tx of allRecentTx) {
    if (!tx.budgetId) continue;
    const key = tx.budgetId.toString();
    const list = txMap.get(key) ?? [];
    if (list.length < 3) { list.push(tx); txMap.set(key, list); }
  }

  const budgetsWithSpent = budgets.map(b => {
    const spentAmount = spentMap.get(b._id.toString()) ?? 0;
    const limit = b.monthlyLimit;
    const recentTx = txMap.get(b._id.toString()) ?? [];
    return {
      id: b._id.toString(), name: b.name, category: b.category, monthlyLimit: limit,
      color: b.color, icon: b.icon, rollover: b.rollover, createdAt: b.createdAt,
      spent: spentAmount, percentage: limit > 0 ? Math.round((spentAmount / limit) * 100) : 0,
      recentTransactions: recentTx.map(t => ({ id: t._id.toString(), name: t.name, amount: t.amount, date: t.date, category: t.category })),
    };
  });

  res.json(budgetsWithSpent);
}

export async function getBudgetDetails(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const { id } = req.params;
  const now = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const budget = await Budget.findById(id);
  if (!budget || budget.userId.toString() !== req.userId!) throw new HttpError('Budget not found', 404);

  const { start: oldestStart } = getMonthRange(5);
  const { end: currentEnd } = getMonthRange(0);

  const sparklineAgg = await Transaction.aggregate([
    { $match: { userId, budgetId: new mongoose.Types.ObjectId(id), type: 'EXPENSE', date: { $gte: oldestStart, $lte: currentEnd } } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
  ]);

  const sparkMap = new Map(sparklineAgg.map(r => [`${r._id.year}-${r._id.month}`, r.total]));
  const sparkline = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    sparkline.push({ month: months[d.getMonth()], spent: sparkMap.get(`${d.getFullYear()}-${d.getMonth() + 1}`) ?? 0 });
  }

  const spentAmount = sparkline[sparkline.length - 1].spent;
  const limit = budget.monthlyLimit;

  const recentTransactions = await Transaction.find({ userId, budgetId: new mongoose.Types.ObjectId(id) }).sort({ date: -1 }).limit(3);

  res.json({
    id: budget._id.toString(), name: budget.name, category: budget.category, monthlyLimit: limit,
    color: budget.color, icon: budget.icon, rollover: budget.rollover,
    spent: spentAmount, percentage: limit > 0 ? Math.round((spentAmount / limit) * 100) : 0,
    sparkline,
    recentTransactions: recentTransactions.map(t => ({ id: t._id.toString(), name: t.name, amount: t.amount, date: t.date, category: t.category })),
  });
}

export async function createBudget(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const body = budgetSchema.parse(req.body);
  const budget = await Budget.create({ ...body, userId });
  res.status(201).json({ id: budget._id.toString(), ...body, spent: 0, percentage: 0, createdAt: budget.createdAt });
}

export async function updateBudget(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;
  const body = budgetSchema.partial().parse(req.body);

  const existing = await Budget.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Budget not found', 404);

  const updated = await Budget.findByIdAndUpdate(id, body, { new: true });
  if (!updated) throw new HttpError('Budget not found', 404);
  res.json({ id: updated._id.toString(), name: updated.name, category: updated.category, monthlyLimit: updated.monthlyLimit, color: updated.color, icon: updated.icon, rollover: updated.rollover });
}

export async function deleteBudget(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await Budget.findById(id);
  if (!existing || existing.userId.toString() !== userId) throw new HttpError('Budget not found', 404);

  await Budget.findByIdAndDelete(id);
  res.json({ message: 'Budget deleted' });
}
