import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function explicitTheme(): Theme | null {
  const value = document.documentElement.dataset.theme;
  return value === 'light' || value === 'dark' ? value : null;
}

function effectiveTheme(): Theme {
  return explicitTheme() ?? (media().matches ? 'dark' : 'light');
}

/**
 * Light/dark theme. Follows the OS setting until the user picks one; the
 * choice is stored in localStorage and applied as `<html data-theme>` (an
 * inline script in index.html applies it before first paint).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(effectiveTheme);

  useEffect(() => {
    const query = media();
    const onChange = () => {
      if (!explicitTheme()) setTheme(query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
