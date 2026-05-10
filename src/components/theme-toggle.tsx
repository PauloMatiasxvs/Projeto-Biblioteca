'use client';

import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/lib/stores/theme-store';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="w-9 h-9 flex items-center justify-center border border-ink/30 hover:bg-ink hover:text-cream-light transition-colors"
    >
      {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
    </button>
  );
}