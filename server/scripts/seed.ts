import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User';
import { Transaction } from '../src/models/Transaction';
import { Budget } from '../src/models/Budget';
import { SavingsPot } from '../src/models/SavingsPot';
import { RecurringBill } from '../src/models/RecurringBill';
import { Notification } from '../src/models/Notification';
import { RefreshToken } from '../src/models/RefreshToken';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/zest';

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: 'zest' });
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Transaction.deleteMany({}), Budget.deleteMany({}),
    SavingsPot.deleteMany({}), RecurringBill.deleteMany({}),
    Notification.deleteMany({}), RefreshToken.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create demo user
  const hashedPassword = await bcrypt.hash('Password1', 12);
  const user = await User.create({
    name: 'Alex Johnson',
    email: 'alex@zest.app',
    password: hashedPassword,
    settings: { currency: 'INR', theme: 'dark', emailNotifications: true },
  });
  const userId = user._id;
  console.log('👤 Created user:', user.email);

  // Create budgets
  const budgetData = [
    { name: 'Groceries', category: 'Food', monthlyLimit: 48000, color: '#10b981' },
    { name: 'Transport', category: 'Transport', monthlyLimit: 16000, color: '#3b82f6' },
    { name: 'Entertainment', category: 'Entertainment', monthlyLimit: 12000, color: '#8b5cf6' },
    { name: 'Dining Out', category: 'Dining', monthlyLimit: 24000, color: '#f59e0b' },
    { name: 'Shopping', category: 'Shopping', monthlyLimit: 32000, color: '#f43f5e' },
  ];
  const budgets = await Budget.insertMany(budgetData.map(b => ({ ...b, userId })));
  console.log('📊 Created', budgets.length, 'budgets');

  // Create savings pots
  await SavingsPot.insertMany([
    { name: 'Emergency Fund', targetAmount: 800000, currentAmount: 336000, color: '#f43f5e', userId, targetDate: new Date('2025-12-31') },
    { name: 'Vacation', targetAmount: 240000, currentAmount: 148000, color: '#06b6d4', userId, targetDate: new Date('2025-08-01') },
    { name: 'New Laptop', targetAmount: 160000, currentAmount: 60000, color: '#8b5cf6', userId },
  ]);
  console.log('🏦 Created savings pots');

  // Create recurring bills
  await RecurringBill.insertMany([
    { name: 'Netflix', amount: 800, category: 'Entertainment', frequency: 'MONTHLY', nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15), color: '#f43f5e', userId },
    { name: 'Spotify', amount: 500, category: 'Entertainment', frequency: 'MONTHLY', nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 20), color: '#10b981', userId },
    { name: 'Rent', amount: 120000, category: 'Housing', frequency: 'MONTHLY', nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), color: '#3b82f6', userId },
    { name: 'Gym', amount: 4000, category: 'Health', frequency: 'MONTHLY', nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 5), color: '#f59e0b', userId },
    { name: 'Internet', amount: 6400, category: 'Utilities', frequency: 'MONTHLY', nextDueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 10), color: '#06b6d4', userId },
  ]);
  console.log('📅 Created recurring bills');

  // Helper to generate past months
  const monthsAgo = (m: number, day = 15) => new Date(new Date().getFullYear(), new Date().getMonth() - m, day);

  // Create transactions - 6 months of history
  const transactions = [];

  // Income (monthly salary)
  for (let m = 5; m >= 0; m--) {
    transactions.push({ userId, name: 'Salary', amount: 440000, type: 'INCOME', category: 'Income', date: monthsAgo(m, 1), merchant: 'Employer Inc.' });
    if (m % 2 === 0) transactions.push({ userId, name: 'Freelance Project', amount: 64000, type: 'INCOME', category: 'Income', date: monthsAgo(m, 20), merchant: 'Client Corp' });
  }

  // Expenses per month
  const groceryBudgetId = budgets[0]._id;
  const transportBudgetId = budgets[1]._id;
  const entertainmentBudgetId = budgets[2]._id;
  const diningBudgetId = budgets[3]._id;
  const shoppingBudgetId = budgets[4]._id;

  for (let m = 5; m >= 0; m--) {
    // Groceries
    transactions.push({ userId, name: 'Supermarket', amount: 9600 + Math.random() * 4800, type: 'EXPENSE', category: 'Food', date: monthsAgo(m, 3), budgetId: groceryBudgetId });
    transactions.push({ userId, name: 'Local Market', amount: 6400 + Math.random() * 3200, type: 'EXPENSE', category: 'Food', date: monthsAgo(m, 10), budgetId: groceryBudgetId });
    transactions.push({ userId, name: 'Big Bazaar', amount: 12000 + Math.random() * 4000, type: 'EXPENSE', category: 'Food', date: monthsAgo(m, 18), budgetId: groceryBudgetId });

    // Transport
    transactions.push({ userId, name: 'Ola/Uber', amount: 1920 + Math.random() * 1600, type: 'EXPENSE', category: 'Transport', date: monthsAgo(m, 5), budgetId: transportBudgetId });
    transactions.push({ userId, name: 'Petrol Pump', amount: 4400 + Math.random() * 2000, type: 'EXPENSE', category: 'Transport', date: monthsAgo(m, 12), budgetId: transportBudgetId });

    // Dining
    const diningMultiplier = m === 0 ? 2.2 : 1; // Anomaly in current month
    transactions.push({ userId, name: 'Restaurant', amount: (1200 + Math.random() * 800) * diningMultiplier, type: 'EXPENSE', category: 'Dining', date: monthsAgo(m, 7), budgetId: diningBudgetId });
    transactions.push({ userId, name: 'Cafe', amount: (480 + Math.random() * 320) * diningMultiplier, type: 'EXPENSE', category: 'Dining', date: monthsAgo(m, 14), budgetId: diningBudgetId });
    transactions.push({ userId, name: 'Fine Dining', amount: (3600 + Math.random() * 2400) * diningMultiplier, type: 'EXPENSE', category: 'Dining', date: monthsAgo(m, 21), budgetId: diningBudgetId });

    // Entertainment
    transactions.push({ userId, name: 'Netflix', amount: 800, type: 'EXPENSE', category: 'Entertainment', date: monthsAgo(m, 15), budgetId: entertainmentBudgetId });
    transactions.push({ userId, name: 'Spotify', amount: 500, type: 'EXPENSE', category: 'Entertainment', date: monthsAgo(m, 20), budgetId: entertainmentBudgetId });

    // Shopping
    transactions.push({ userId, name: 'Amazon', amount: 4800 + Math.random() * 6400, type: 'EXPENSE', category: 'Shopping', date: monthsAgo(m, 8), budgetId: shoppingBudgetId });

    // Utilities
    transactions.push({ userId, name: 'Electricity Bill', amount: 6800 + Math.random() * 3200, type: 'EXPENSE', category: 'Utilities', date: monthsAgo(m, 2) });
    transactions.push({ userId, name: 'Internet', amount: 6400, type: 'EXPENSE', category: 'Utilities', date: monthsAgo(m, 10) });
    transactions.push({ userId, name: 'Rent', amount: 120000, type: 'EXPENSE', category: 'Housing', date: monthsAgo(m, 1) });
  }

  await Transaction.insertMany(transactions.map(t => ({ ...t, amount: Math.round(t.amount * 100) / 100 })));
  console.log('💸 Created', transactions.length, 'transactions');

  // Notification
  await Notification.create({
    userId, type: 'GENERAL', title: 'Welcome to Zest!',
    message: 'Your financial dashboard is ready. Start tracking your spending and savings goals!',
  });
  console.log('🔔 Created welcome notification');

  console.log('\n✅ Seed complete!');
  console.log('📧 Email: alex@zest.app');
  console.log('🔑 Password: Password1');
  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
