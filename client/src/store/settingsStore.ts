import { create } from 'zustand';
import type { UserSettings, Currency, Theme } from '../types';

interface SettingsState {
  settings: UserSettings | null;
  currency: Currency;
  theme: Theme;
  setSettings: (settings: UserSettings) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: Theme) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: null,
  currency: 'INR',
  theme: 'light',
  setSettings: (settings) =>
    set({ settings, currency: settings.currency, theme: settings.theme }),
  setCurrency: (currency) =>
    set((state) => ({ currency, settings: state.settings ? { ...state.settings, currency } : null })),
  setTheme: (theme) =>
    set((state) => ({ theme, settings: state.settings ? { ...state.settings, theme } : null })),
}));
