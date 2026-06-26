import { Response } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { RecurringBill } from '../models/RecurringBill';
import { SavingsPot } from '../models/SavingsPot';
import type { AuthRequest } from '../middleware/authenticate';

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  const userId = new mongoose.Types.ObjectId(req.userId!);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // All-time totals for net worth
  const [allTimeTotals, lastMonthTotals, monthlyTotals, sixMonthChart, categorySpending, recentTransactions, upcomingBills, savingsProgress, budgets] = await Promise.all([
    // All-time income vs expense
    Transaction.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    // Last month totals
    Transaction.aggregate([
      { $match: { userId, date: { $lte: endOfLastMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    // Current month totals
    Transaction.aggregate([
      { $match: { userId, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    // 6 month income vs expense chart
    Transaction.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo, $lte: endOfMonth } } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]),
    // Category spending this month
    Transaction.aggregate([
      { $match: { userId, type: 'EXPENSE', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    // Recent transactions
    Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .populate('budgetId', 'name color'),
    // Upcoming bills
    RecurringBill.find({ userId, isActive: true, nextDueDate: { $gte: now, $lte: in7Days } })
      .sort({ nextDueDate: 1 }),
    // Savings pots
    SavingsPot.find({ userId }).sort({ createdAt: -1 }),
    // Budgets for health section
    Budget.find({ userId }),
  ]);

  // Process all-time totals
  const totalIncome = allTimeTotals.find(r => r._id === 'INCOME')?.total ?? 0;
  const totalExpenses = allTimeTotals.find(r => r._id === 'EXPENSE')?.total ?? 0;
  const netWorth = totalIncome - totalExpenses;

  const lastIncome = lastMonthTotals.find(r => r._id === 'INCOME')?.total ?? 0;
  const lastExpenses = lastMonthTotals.find(r => r._id === 'EXPENSE')?.total ?? 0;
  const lastMonthNetWorth = lastIncome - lastExpenses;
  const netWorthChange = lastMonthNetWorth === 0 ? null : ((netWorth - lastMonthNetWorth) / Math.abs(lastMonthNetWorth)) * 100;

  const monthlyIncome = monthlyTotals.find(r => r._id === 'INCOME')?.total ?? 0;
  const monthlyExpenses = monthlyTotals.find(r => r._id === 'EXPENSE')?.total ?? 0;

  // Build 6-month chart
  const chartMap = new Map<string, { income: number; expenses: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartMap.set(`${d.getFullYear()}-${d.getMonth() + 1}`, { income: 0, expenses: 0 });
  }
  for (const row of sixMonthChart) {
    const key = `${row._id.year}-${row._id.month}`;
    const entry = chartMap.get(key);
    if (entry) {
      if (row._id.type === 'INCOME') entry.income = row.total;
      else entry.expenses = row.total;
    }
  }
  const incomeVsExpenses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const entry = chartMap.get(key)!;
    incomeVsExpenses.push({ month: months[d.getMonth()], income: entry.income, expenses: entry.expenses });
  }

  // Category spending with percentages
  const totalSpent = categorySpending.reduce((s, c) => s + c.total, 0);
  const categoryColors = ['#3b82f6','#f59e0b','#10b981','#f43f5e','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
  const categorySpendingFormatted = categorySpending.map((c, i) => ({
    category: c._id,
    amount: c.total,
    percentage: totalSpent > 0 ? Math.round((c.total / totalSpent) * 100) : 0,
    color: categoryColors[i % categoryColors.length],
  }));

  // Budget health - batch get spent per budget this month
  const budgetIds = budgets.map(b => b._id);
  const budgetSpentAgg = await Transaction.aggregate([
    { $match: { userId, type: 'EXPENSE', date: { $gte: startOfMonth, $lte: endOfMonth }, budgetId: { $in: budgetIds } } },
    { $group: { _id: '$budgetId', total: { $sum: '$amount' } } },
  ]);
  const budgetSpentMap = new Map(budgetSpentAgg.map(r => [r._id.toString(), r.total]));
  const budgetHealth = budgets.map(b => {
    const spentAmount = budgetSpentMap.get(b._id.toString()) ?? 0;
    const limit = b.monthlyLimit;
    return { id: b._id.toString(), name: b.name, category: b.category, spent: spentAmount, limit, percentage: limit > 0 ? Math.round((spentAmount / limit) * 100) : 0, color: b.color, icon: b.icon };
  });

  const totalSaved = savingsProgress.reduce((s, p) => s + p.currentAmount, 0);

  res.json({
    netWorth, netWorthChange,
    totalAssets: totalIncome, totalLiabilities: totalExpenses,
    monthlyIncome, monthlyExpenses,
    totalSaved,
    incomeVsExpenses,
    categorySpending: categorySpendingFormatted,
    budgetHealth,
    recentTransactions: recentTransactions.map(t => ({
      id: t._id.toString(), name: t.name, amount: t.amount, type: t.type,
      category: t.category, date: t.date, note: t.note, merchant: t.merchant,
      budget: t.budgetId ? { name: (t.budgetId as any).name, color: (t.budgetId as any).color } : null,
    })),
    upcomingBills: upcomingBills.map(b => ({ id: b._id.toString(), name: b.name, amount: b.amount, nextDueDate: b.nextDueDate, frequency: b.frequency, icon: b.icon, color: b.color })),
    savingsProgress: savingsProgress.map(p => ({ id: p._id.toString(), name: p.name, currentAmount: p.currentAmount, targetAmount: p.targetAmount, targetDate: p.targetDate, color: p.color, icon: p.icon })),
  });
}
