import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const transactionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().datetime({ offset: true }).or(z.string().date()),
  note: z.string().max(500).optional(),
  merchant: z.string().max(200).optional(),
  budgetId: z.string().optional(),
});

export const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Limit must be positive'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#3b82f6'),
  icon: z.string().max(10).default('💰'),
  rollover: z.boolean().default(false),
});

export const savingsPotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  targetAmount: z.number().positive('Target must be positive'),
  targetDate: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
  icon: z.string().max(10).default('🏦'),
});

export const potTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['ADD', 'WITHDRAW']),
  note: z.string().max(500).optional(),
});

export const recurringBillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  nextDueDate: z.string(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
});

export const settingsSchema = z.object({
  currency: z.enum(['USD', 'INR', 'EUR', 'GBP']).optional(),
  theme: z.enum(['dark', 'light', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email').optional(),
  avatar: z.string().url('Must be a valid URL').optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .optional(),
});
