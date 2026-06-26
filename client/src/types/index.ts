// Global TypeScript types for the Zest app

export type TransactionType = 'INCOME' | 'EXPENSE';
export type BillFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type PotTransactionType = 'ADD' | 'WITHDRAW';
export type NotificationType = 'BILL_DUE' | 'BUDGET_ALERT' | 'POT_GOAL_REACHED' | 'GENERAL';
export type Theme = 'dark' | 'light' | 'system';
export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
  merchant?: string;
  budgetId?: string;
  budget?: Budget;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  category: string;
  monthlyLimit: number;
  color: string;
  icon: string;
  rollover: boolean;
  createdAt: string;
  updatedAt: string;
  spent?: number;
  transactions?: Transaction[];
}

export interface SavingsPot {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  potTransactions?: PotTransaction[];
}

export interface PotTransaction {
  id: string;
  potId: string;
  amount: number;
  type: PotTransactionType;
  note?: string;
  createdAt: string;
}

export interface RecurringBill {
  id: string;
  userId: string;
  name: string;
  amount: number;
  category: string;
  frequency: BillFrequency;
  nextDueDate: string;
  lastPaidDate?: string;
  icon?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'PAID' | 'DUE_SOON' | 'OVERDUE' | 'UPCOMING';
  daysUntilDue?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  currency: Currency;
  theme: Theme;
  emailNotifications: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard types
export interface DashboardData {
  netWorth: number;
  netWorthChange?: number | null;
  totalAssets: number;
  totalLiabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeVsExpenses: MonthlyData[];
  categorySpending: CategorySpending[];
  budgetHealth: BudgetHealth[];
  recentTransactions: Transaction[];
  upcomingBills: RecurringBill[];
  savingsProgress: SavingsPot[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetHealth {
  id: string;
  name: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  color: string;
  icon: string;
}

// Filter types
export interface TransactionFilters {
  search?: string;
  category?: string;
  type?: TransactionType;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'amount' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// AI Insights types
export interface InsightData {
  monthlySummary: string;
  anomalies: Anomaly[];
  suggestions: Suggestion[];
  streaks: Streak[];
}

export interface Anomaly {
  category: string;
  currentAmount: number;
  averageAmount: number;
  percentageChange: number;
  message: string;
}

export interface Suggestion {
  title: string;
  description: string;
  potentialSavings?: number;
}

export interface Streak {
  type: string;
  description: string;
  count: number;
  icon: string;
}
