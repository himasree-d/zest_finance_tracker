import { useEffect, useState } from 'react';
import { Bell, Check, Trash2, CheckCircle2, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotificationStore } from '../../store/notificationStore';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/utils';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function NotificationsPage() {
  const { notifications, setNotifications } = useNotificationStore();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const { loading: isLoading, execute: fetchNotifications } = useApi(async () => {
    const data = await api.notifications.getAll();
    setNotifications(data);
  });

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      fetchNotifications();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.delete(id);
      fetchNotifications();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.notifications.clearAll();
      toast.success('Notifications cleared');
      setClearConfirmOpen(false);
      fetchNotifications();
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      fetchNotifications();
    } catch {
      toast.error('Failed to mark all read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BILL_DUE': return <AlertTriangle className="text-amber-500" />;
      case 'OVER_BUDGET': return <ShieldAlert className="text-rose-500" />;
      case 'GOAL_REACHED': return <CheckCircle2 className="text-emerald-500" />;
      default: return <Info className="text-electric-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Notifications</h1>
          <p className="text-slate-400 mt-1">Stay updated on your account activity.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleMarkAllRead()} 
            className="btn-secondary"
            disabled={notifications.every(n => n.read)}
          >
            <Check size={18} className="mr-2" /> Mark All Read
          </button>
          <button 
            onClick={() => setClearConfirmOpen(true)} 
            className="btn-danger"
            disabled={notifications.length === 0}
          >
            <Trash2 size={18} className="mr-2" /> Clear All
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-charcoal-700 rounded-xl animate-pulse"></div>)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-charcoal-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-slate-500 h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">You're all caught up</h3>
            <p className="text-slate-400">No new notifications right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-charcoal-700/50">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-6 flex gap-4 transition-colors ${notif.read ? 'bg-charcoal-900/30' : 'bg-charcoal-800/30 border-l-2 border-l-electric-500'}`}
              >
                <div className="shrink-0 pt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold ${notif.read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm ${notif.read ? 'text-slate-500' : 'text-slate-400'}`}>
                    {notif.message}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {!notif.read && (
                    <button 
                      onClick={() => handleMarkRead(notif.id)}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleClearAll}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This cannot be undone."
        isDanger={true}
        confirmText="Clear All"
      />
    </div>
  );
}
