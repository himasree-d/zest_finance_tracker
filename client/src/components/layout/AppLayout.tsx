import { useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Target, PiggyBank,
  Receipt, Sparkles, Bell, Settings, LogOut, Menu, X, Sun, Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useSettingsStore } from '../../store/settingsStore';
import { api } from '../../lib/api';
import { useMagnetic } from '../../hooks/useMagnetic';
import toast from 'react-hot-toast';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { theme, setTheme } = useSettingsStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useMagnetic(navRef);

  const isDark = theme !== 'light';

  const handleThemeToggle = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    // Apply immediately to DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Update store immediately
    setTheme(newTheme as any);
    // Persist to backend (fire-and-forget)
    try {
      await api.settings.updateSettings({ theme: newTheme });
    } catch {
      // silent fail — local state is still correct
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    { name: 'Dashboard',       path: '/',              icon: <LayoutDashboard size={20} /> },
    { name: 'Transactions',    path: '/transactions',  icon: <ArrowLeftRight size={20} /> },
    { name: 'Budgets',         path: '/budgets',       icon: <Target size={20} /> },
    { name: 'Savings Pots',    path: '/savings',       icon: <PiggyBank size={20} /> },
    { name: 'Recurring Bills', path: '/bills',         icon: <Receipt size={20} /> },
    { name: 'AI Insights',     path: '/insights',      icon: <Sparkles size={20} style={{ color: '#f59e0b' }} /> },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: (
        <div className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: '#2D7D6F' }} />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-electric-500 border-2 border-charcoal-800" />
            </span>
          )}
        </div>
      )
    },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo + Theme Toggle */}
      <div className="p-5 flex items-center justify-between border-b border-charcoal-700">
        <span className="text-2xl font-mono font-bold tracking-tight flex items-center text-slate-100">
          ZEST<span className="text-3xl leading-[0]" style={{ color: '#2D7D6F' }}>.</span>
        </span>
        {/* Theme toggle pill */}
        <button
          onClick={handleThemeToggle}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="relative flex items-center w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-electric-500/50"
          style={{ backgroundColor: isDark ? '#2D7D6F' : '#E8E5DF', border: '1px solid', borderColor: isDark ? '#1F5F55' : '#D4CFC7' }}
        >
          {/* Track icons */}
          <Sun size={12} className="absolute left-1.5 transition-opacity duration-200" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#f59e0b', opacity: isDark ? 0.4 : 1 }} />
          <Moon size={12} className="absolute right-1.5 transition-opacity duration-200" style={{ color: isDark ? '#fff' : 'rgba(0,0,0,0.2)', opacity: isDark ? 1 : 0.3 }} />
          {/* Thumb */}
          <span
            className="absolute top-0.5 h-6 w-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
            style={{
              left: isDark ? 'calc(100% - 1.6rem)' : '2px',
              backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            {isDark
              ? <Moon size={12} style={{ color: '#2D7D6F' }} />
              : <Sun size={12} style={{ color: '#f59e0b' }} />
            }
          </span>
        </button>
      </div>

      <nav ref={navRef} className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            onClick={() => setMobileMenuOpen(false)}
            data-magnetic="0.28"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-charcoal-700">
        <div className="rounded-xl p-3 flex items-center gap-3 bg-charcoal-900/60">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm"
            style={{ backgroundColor: '#2D7D6F' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-100">{user?.name}</p>
            <p className="text-xs truncate text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="transition-colors p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-charcoal-900">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-charcoal-800 border-r border-charcoal-700">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 bg-charcoal-800/90 backdrop-blur-md border-b border-charcoal-700">
        <span className="text-xl font-mono font-bold flex items-center text-slate-100">
          ZEST<span className="text-2xl leading-[0] text-electric-500">.</span>
        </span>
        <div className="flex items-center gap-2">
          {/* Mobile theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-xl transition-colors text-slate-400 hover:text-slate-100 hover:bg-charcoal-700"
            title="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full flex flex-col animate-slide-in-right bg-charcoal-800 border-r border-charcoal-700"
            onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pt-16 md:pt-0 no-scrollbar">
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}