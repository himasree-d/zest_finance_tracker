import { api as axiosApi } from './axios';
import type {
  User, Transaction, Budget, SavingsPot, RecurringBill, Notification, UserSettings,
  DashboardData, TransactionFilters, PaginatedResponse, InsightData
} from '../types';

export const api = {
  auth: {
    register: async (data: unknown) => (await axiosApi.post('/auth/register', data)).data,
    login: async (data: unknown) => (await axiosApi.post('/auth/login', data)).data,
    logout: async () => (await axiosApi.post('/auth/logout')).data,
    getMe: async (): Promise<User> => (await axiosApi.get('/auth/me')).data.user,
  },
  dashboard: {
    getDashboard: async (): Promise<DashboardData> => (await axiosApi.get('/dashboard')).data,
  },
  transactions: {
    getAll: async (filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> => 
      (await axiosApi.get('/transactions', { params: filters })).data,
    create: async (data: unknown): Promise<Transaction> => (await axiosApi.post('/transactions', data)).data,
    update: async (id: string, data: unknown): Promise<Transaction> => (await axiosApi.put(`/transactions/${id}`, data)).data,
    delete: async (id: string) => (await axiosApi.delete(`/transactions/${id}`)).data,
    bulkCreate: async (data: unknown[]) => (await axiosApi.post('/transactions/bulk', data)).data,
    bulkDelete: async (ids: string[]) => (await axiosApi.delete('/transactions/bulk', { data: { ids } })).data,
    exportCSV: async (filters?: TransactionFilters): Promise<string> => 
      (await axiosApi.get('/transactions/export', { params: filters, responseType: 'text' })).data,
  },
  budgets: {
    getAll: async (): Promise<Budget[]> => (await axiosApi.get('/budgets')).data,
    getOne: async (id: string): Promise<Budget> => (await axiosApi.get(`/budgets/${id}`)).data,
    create: async (data: unknown): Promise<Budget> => (await axiosApi.post('/budgets', data)).data,
    update: async (id: string, data: unknown): Promise<Budget> => (await axiosApi.put(`/budgets/${id}`, data)).data,
    delete: async (id: string) => (await axiosApi.delete(`/budgets/${id}`)).data,
  },
  savings: {
    getAll: async (): Promise<SavingsPot[]> => (await axiosApi.get('/savings')).data,
    create: async (data: unknown): Promise<SavingsPot> => (await axiosApi.post('/savings', data)).data,
    update: async (id: string, data: unknown): Promise<SavingsPot> => (await axiosApi.put(`/savings/${id}`, data)).data,
    delete: async (id: string) => (await axiosApi.delete(`/savings/${id}`)).data,
    addTransaction: async (id: string, data: unknown) => (await axiosApi.post(`/savings/${id}/transaction`, data)).data,
  },
  bills: {
    getAll: async (): Promise<RecurringBill[]> => (await axiosApi.get('/bills')).data,
    create: async (data: unknown): Promise<RecurringBill> => (await axiosApi.post('/bills', data)).data,
    update: async (id: string, data: unknown): Promise<RecurringBill> => (await axiosApi.put(`/bills/${id}`, data)).data,
    delete: async (id: string) => (await axiosApi.delete(`/bills/${id}`)).data,
    markPaid: async (id: string): Promise<RecurringBill> => (await axiosApi.post(`/bills/${id}/pay`)).data,
  },
  insights: {
    getInsights: async (): Promise<InsightData> => (await axiosApi.get('/insights')).data,
  },
  notifications: {
    getAll: async (): Promise<Notification[]> => (await axiosApi.get('/notifications')).data,
    markRead: async (id: string) => (await axiosApi.put(`/notifications/${id}/read`)).data,
    markAllRead: async () => (await axiosApi.put('/notifications/read-all')).data,
    delete: async (id: string) => (await axiosApi.delete(`/notifications/${id}`)).data,
    clearAll: async () => (await axiosApi.delete('/notifications')).data,
  },
  settings: {
    getSettings: async (): Promise<{ user: User, settings: UserSettings }> => (await axiosApi.get('/settings')).data,
    updateSettings: async (data: unknown): Promise<UserSettings> => (await axiosApi.put('/settings', data)).data,
    updateProfile: async (data: unknown): Promise<User> => (await axiosApi.put('/settings/profile', data)).data,
    exportData: async (): Promise<any> => (await axiosApi.get('/settings/export')).data,
    deleteAccount: async () => (await axiosApi.delete('/settings/account')).data,
  }
};
