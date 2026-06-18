'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('stockflow-appearance');
    if (saved) {
      const { darkMode } = JSON.parse(saved);
      document.documentElement.classList.toggle('dark', !!darkMode);
    }
  }, []);

  return <>{children}</>;
}
