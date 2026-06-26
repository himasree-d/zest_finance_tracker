import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Download, AlertTriangle, User, Lock, Mail, Sun, Moon, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { settingsSchema, profileSchema } from '../../lib/validations';
import ConfirmModal from '../../components/ui/ConfirmModal';
import SkeletonCard from '../../components/ui/SkeletonCard';
import type { z } from 'zod';

type SettingsFormValues = z.infer<typeof settingsSchema>;
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { setUser, logout } = useAuthStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const setStoreSettings = useSettingsStore(state => state.setSettings);
  const setTheme = useSettingsStore(state => state.setTheme);
  const liveTheme = useSettingsStore(state => state.theme);

  const { data, loading, execute: fetchSettings } = useApi(api.settings.getSettings);
  const { execute: updateSettings, loading: savingSettings } = useApi(api.settings.updateSettings);
  const { execute: updateProfile, loading: savingProfile } = useApi(api.settings.updateProfile);
  const { execute: exportData, loading: exporting } = useApi(api.settings.exportData);
  const { execute: deleteAccount, loading: deleting } = useApi(api.settings.deleteAccount);

  const { register: regProfile, handleSubmit: submitProfile, reset: resetProfile, formState: { errors: profileErrors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema)
  });

  const { register: regSettings, handleSubmit: submitSettings, reset: resetSettings } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema)
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (data) {
      resetProfile({ name: data.user.name, email: data.user.email });
      if (data.settings) {
        resetSettings({
          currency: data.settings.currency as any,
          theme: data.settings.theme as any,
          emailNotifications: data.settings.emailNotifications
        });
      }
    }
  }, [data, resetProfile, resetSettings]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const updatedUser = await updateProfile(values);
      setUser(updatedUser);
      toast.success('Profile updated');
      resetProfile({ ...values, currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const onSettingsSubmit = async (values: SettingsFormValues) => {
    try {
      await updateSettings(values);
      setStoreSettings(values as any);
      // Apply theme immediately
      const newTheme = values.theme;
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (newTheme) setTheme(newTheme as any);
      toast.success('Preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportData();
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zest-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      toast.success('Account deleted');
      logout();
      window.location.href = '/login';
    } catch {
      toast.error('Failed to delete account');
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and app preferences.</p>
      </div>

      <div className="flex border-b border-charcoal-700">
        <button
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-electric-500 text-electric-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preferences' ? 'border-electric-500 text-electric-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-8 animate-fade-in">
          <div className="card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
            <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                    <input type="text" className={`input pl-10 ${profileErrors.name ? 'input-error' : ''}`} {...regProfile('name')} />
                  </div>
                  {profileErrors.name && <p className="mt-1 text-xs text-rose-500">{profileErrors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                    <input type="email" className={`input pl-10 ${profileErrors.email ? 'input-error' : ''}`} {...regProfile('email')} />
                  </div>
                  {profileErrors.email && <p className="mt-1 text-xs text-rose-500">{profileErrors.email.message}</p>}
                </div>
              </div>

              <div className="border-t border-charcoal-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                      <input type="password" placeholder="••••••••" className={`input pl-10 ${profileErrors.currentPassword ? 'input-error' : ''}`} {...regProfile('currentPassword')} />
                    </div>
                    {profileErrors.currentPassword && <p className="mt-1 text-xs text-rose-500">{profileErrors.currentPassword.message}</p>}
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
                      <input type="password" placeholder="••••••••" className={`input pl-10 ${profileErrors.newPassword ? 'input-error' : ''}`} {...regProfile('newPassword')} />
                    </div>
                    {profileErrors.newPassword && <p className="mt-1 text-xs text-rose-500">{profileErrors.newPassword.message}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={savingProfile} className="btn-primary">
                  <Save size={18} className="mr-2" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-8 animate-fade-in">
          <div className="card p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">App Preferences</h2>
            <form onSubmit={submitSettings(onSettingsSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Currency</label>
                  <select className="input" {...regSettings('currency')}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="label">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="cursor-pointer">
                        <input type="radio" {...regSettings('theme')} value={value} className="sr-only" />
                        <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                          ${ liveTheme === value
                              ? 'border-electric-500 bg-electric-500/10'
                              : 'border-charcoal-600 hover:border-charcoal-500 bg-charcoal-700'
                          }`}>
                          <Icon size={22} className={liveTheme === value ? 'text-electric-500' : 'text-slate-400'} />
                          <span className={`text-sm font-medium ${ liveTheme === value ? 'text-electric-400' : 'text-slate-400' }`}>{label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-charcoal-800 rounded-xl border border-charcoal-600">
                <input 
                  type="checkbox" 
                  id="emailNotifications" 
                  className="w-5 h-5 rounded bg-charcoal-900 border-charcoal-500 text-electric-500 focus:ring-electric-500/50"
                  {...regSettings('emailNotifications')}
                />
                <div>
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-white cursor-pointer block">Email Notifications</label>
                  <p className="text-xs text-slate-400">Receive weekly summaries and important alerts via email.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" disabled={savingSettings} className="btn-primary">
                  <Save size={18} className="mr-2" />
                  {savingSettings ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Management Section (Always visible at bottom) */}
      <div className="card p-6 md:p-8 border-rose-500/20">
        <h2 className="text-xl font-semibold text-white mb-6">Data Management</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-charcoal-800 rounded-xl border border-charcoal-700">
            <div>
              <h3 className="font-medium text-white">Export Data</h3>
              <p className="text-sm text-slate-400 mt-1">Download all your transactions, budgets, and settings as a JSON file.</p>
            </div>
            <button onClick={handleExport} disabled={exporting} className="btn-secondary whitespace-nowrap shrink-0">
              <Download size={18} className="mr-2" /> Export JSON
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-rose-500/5 rounded-xl border border-rose-500/20">
            <div>
              <h3 className="font-medium text-rose-400">Delete Account</h3>
              <p className="text-sm text-rose-400/70 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button onClick={() => setDeleteConfirmOpen(true)} className="btn-danger whitespace-nowrap shrink-0">
              <AlertTriangle size={18} className="mr-2" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={deleting}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? All your data, including transactions, budgets, and savings, will be permanently removed. This action cannot be undone."
        isDanger={true}
        confirmText="Yes, Delete My Account"
      />
    </div>
  );
}
