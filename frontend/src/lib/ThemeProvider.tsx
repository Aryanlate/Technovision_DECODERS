'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ResolvedTheme,
  ThemePreference,
  applyTheme,
  getStoredThemePreference,
  isThemePreference,
  resolveTheme,
  setStoredThemePreference,
  systemPrefersDark,
  THEME_STORAGE_KEY
} from './theme';

interface ThemeContextValue {
  /** What the user chose: light, dark or follow the system. */
  preference: ThemePreference;
  /** What is actually rendered right now. */
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  /** Flips between light and dark, pinning an explicit preference. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  resolved: 'light',
  setPreference: () => undefined,
  toggle: () => undefined
});

/**
 * Applies the cream (light) or dark theme, follows the system setting on first
 * visit and remembers the user's choice.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Server render assumes light; the inline init script has already set the real
  // class on <html> before paint, and this state syncs with it after mount.
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  // Sync with the stored preference / the inline script's decision.
  useEffect(() => {
    const stored = getStoredThemePreference();
    setPreferenceState(stored);
    setResolved(resolveTheme(stored));

    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && isThemePreference(event.newValue)) {
        setPreferenceState(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Re-resolve whenever the preference changes, and follow live system changes.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const recompute = () => setResolved(resolveTheme(preference));

    recompute();
    if (preference === 'system') {
      media.addEventListener('change', recompute);
      return () => media.removeEventListener('change', recompute);
    }
    return undefined;
  }, [preference]);

  // Push the resolved theme onto <html>.
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setStoredThemePreference(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(resolveTheme(preference) === 'dark' ? 'light' : 'dark');
  }, [preference, setPreference]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** Reads the current theme state and setters from context. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Small helper for the inline boot script's initial guess. */
export function initialResolvedTheme(): ResolvedTheme {
  return systemPrefersDark() ? 'dark' : 'light';
}
