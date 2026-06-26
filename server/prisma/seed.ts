import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create User
  const password = await bcrypt.hash('Test1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@zest.app' },
    update: {},
    create: {
      email: 'test@zest.app',
      name: 'Alex Morgan',
      password,
      settings: {
        create: {
          currency: 'USD',
          theme: 'dark',
        },
      },
    },
  });

  console.log('User created:', user.email);

  // 2. Create Budgets
  const budgets = [
    { name: 'Groceries', category: 'Food', limit: 500, color: '#10b981', icon: '🛒' },
    { name: 'Dining Out', category: 'Food', limit: 300, color: '#f59e0b', icon: '🍽️' },
    { name: 'Gasoline', category: 'Transport', limit: 150, color: '#3b82f6', icon: '⛽' },
    { name: 'Movies & Subs', category: 'Entertainment', limit: 100, color: '#8b5cf6', icon: '🍿' },
    { name: 'Pharmacy', category: 'Health', limit: 100, color: '#f43f5e', icon: '💊' },
  ];

  for (const b of budgets) {
    await prisma.budget.upsert({
      where: { id: `seed-budget-${b.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-budget-${b.name.replace(/\s+/g, '-').toLowerCase()}`,
        userId: user.id,
        name: b.name,
        category: b.category,
        monthlyLimit: b.limit,
        color: b.color,
        icon: b.icon,
      },
    });
  }

  const createdBudgets = await prisma.budget.findMany({ where: { userId: user.id } });
  console.log(`Created ${createdBudgets.length} budgets.`);

  // 3. Create Transactions (mix of income and expenses over last 3 months)
  const now = new Date();
  
  // Salary
  await prisma.transaction.create({
    data: {
      userId: user.id,
      name: 'Tech Corp Inc Salary',
      amount: 4500,
      type: 'INCOME',
      category: 'Income',
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      merchant: 'Tech Corp Inc',
    }
  });

  // Random expenses
  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health'];
  const merchants = ['Whole Foods', 'Shell Station', 'Netflix', 'Amazon', 'Walgreens'];
  
  for (let i = 0; i < 30; i++) {
    const isIncome = Math.random() > 0.8;
    const catIdx = Math.floor(Math.random() * categories.length);
    const date = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // last 90 days
    
    await prisma.transaction.create({
      data: {
        userId: user.id,
        name: isIncome ? 'Side Hustle' : merchants[catIdx] + ' Purchase',
        amount: isIncome ? Math.floor(Math.random() * 500) + 100 : Math.floor(Math.random() * 100) + 10,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        category: isIncome ? 'Income' : categories[catIdx],
        date: date,
        merchant: isIncome ? undefined : merchants[catIdx],
        budgetId: isIncome ? undefined : createdBudgets.find(b => b.category === categories[catIdx])?.id,
      }
    });
  }
  
  console.log('Created transactions.');

  // 4. Create Savings Pots
  const pots = [
    { name: 'Emergency Fund', target: 10000, current: 4500, color: '#3b82f6', icon: '🏦' },
    { name: 'Vacation', target: 2000, current: 800, color: '#10b981', icon: '✈️' },
    { name: 'New Car', target: 15000, current: 2000, color: '#f59e0b', icon: '🚗' },
  ];

  for (const p of pots) {
    await prisma.savingsPot.create({
      data: {
        userId: user.id,
        name: p.name,
        targetAmount: p.target,
        currentAmount: p.current,
        color: p.color,
        icon: p.icon,
      }
    });
  }
  
  console.log('Created savings pots.');

  // 5. Create Recurring Bills
  const bills = [
    { name: 'Rent', amount: 1500, category: 'Housing', freq: 'MONTHLY', due: new Date(now.getFullYear(), now.getMonth(), 1) },
    { name: 'Internet', amount: 80, category: 'Utilities', freq: 'MONTHLY', due: new Date(now.getFullYear(), now.getMonth(), 15) },
    { name: 'Gym', amount: 50, category: 'Health', freq: 'MONTHLY', due: new Date(now.getFullYear(), now.getMonth(), 20) },
  ];

  for (const b of bills) {
    // If due date passed, set to next month
    if (b.due < now) {
      b.due.setMonth(b.due.getMonth() + 1);
    }
    
    await prisma.recurringBill.create({
      data: {
        userId: user.id,
        name: b.name,
        amount: b.amount,
        category: b.category,
        frequency: b.freq as any,
        nextDueDate: b.due,
        color: '#8b5cf6',
      }
    });
  }
  
  console.log('Created recurring bills.');
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
