import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/**
 * Light/dark theme applied as `<html data-theme>`. An inline script in
 * index.html sets it before first paint; this hook follows OS changes until the
 * user picks a theme, then remembers the choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    const query = media();
    const onChange = () => {
      if (storedTheme()) return;
      const next: Theme = query.matches ? 'dark' : 'light';
      apply(next);
      setTheme(next);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); the theme still applies for this visit.
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
