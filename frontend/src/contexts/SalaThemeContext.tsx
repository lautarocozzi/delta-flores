import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { Sun, Gamepad2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SalaTheme = 'radiant' | 'dracula';

interface ThemeOption {
  id: SalaTheme;
  icon: LucideIcon;
  label: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'radiant', icon: Sun, label: 'Radiant' },
  { id: 'dracula', icon: Gamepad2, label: 'Dracula' },
];

interface SalaThemeContextValue {
  theme: SalaTheme;
  setTheme: (theme: SalaTheme) => void;
  isRadiant: boolean;
  isDracula: boolean;
}

const SalaThemeContext = createContext<SalaThemeContextValue | null>(null);

export function SalaThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<SalaTheme>(() => {
    const saved = localStorage.getItem('sala-theme');
    if (saved === 'radiant' || saved === 'dracula') return saved;
    return 'radiant';
  });

  const setTheme = useCallback((t: SalaTheme) => {
    setThemeState(t);
    localStorage.setItem('sala-theme', t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-radiant', 'theme-dracula');
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <SalaThemeContext.Provider
      value={{ theme, setTheme, isRadiant: theme === 'radiant', isDracula: theme === 'dracula' }}
    >
      {children}
    </SalaThemeContext.Provider>
  );
}

export function useSalaTheme() {
  const ctx = useContext(SalaThemeContext);
  if (!ctx) throw new Error('useSalaTheme must be used within SalaThemeProvider');
  return ctx;
}
