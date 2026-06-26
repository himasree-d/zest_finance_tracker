import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { api } from './lib/api';
import { useSettingsStore } from './store/settingsStore';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import TransactionsPage from './features/transactions/TransactionsPage';
import BudgetsPage from './features/budgets/BudgetsPage';
import SavingsPage from './features/savings/SavingsPage';
import BillsPage from './features/bills/BillsPage';
import InsightsPage from './features/insights/InsightsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import SettingsPage from './features/settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-charcoal-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { setUser, setLoading, isLoading } = useAuthStore();
  const setNotifications = useNotificationStore(state => state.setNotifications);
  const theme = useSettingsStore(state => state.theme || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.auth.getMe();
        setUser(user);
        const notifs = await api.notifications.getAll();
        setNotifications(notifs);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-charcoal-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="bills" element={<BillsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
