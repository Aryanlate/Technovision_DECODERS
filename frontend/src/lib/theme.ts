/**
 * Theme preference handling for the cream (light) and dark variants.
 *
 * The cream palette is the base design. A user may follow the system setting or
 * pin light/dark explicitly. The resolved theme is applied by toggling `.dark`
 * on <html>, which globals.css uses to remap the editorial palette.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'opportunitykit_theme';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Returns the stored preference, defaulting to following the system setting. */
export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : 'system';
}

export function setStoredThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(
    new CustomEvent('opportunitykit_theme_changed', { detail: { preference } })
  );
}

/** True when the operating system currently asks for a dark colour scheme. */
export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Turns a preference into the theme that should actually be rendered. */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return preference;
}

/** Applies the resolved theme to <html> so Tailwind's dark variants take over. */
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

/**
 * Runs before paint (see the inline script in layout.tsx) to avoid a flash of
 * the wrong theme on first load.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);if(p!=='light'&&p!=='dark'){p='system';}var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
