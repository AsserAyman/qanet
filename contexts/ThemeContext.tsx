import React, { createContext, useContext } from 'react';

export type ThemeMode = 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  overlay: string;
  headerBackground: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

const darkTheme: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  card: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  primary: '#3b82f6',
  primaryLight: '#1e40af',
  border: '#475569',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#eab308',
  overlay: 'rgba(15, 23, 42, 0.9)',
  headerBackground: '#1e293b',
  tabBarBackground: '#1e293b',
  tabBarBorder: '#475569',
};

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = darkTheme;
  const themeMode: ThemeMode = 'dark';
  const isDark = true;

  // Keep setThemeMode as a no-op for backward compatibility
  const setThemeMode = (_mode: ThemeMode) => {
    // Dark mode only - no-op
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}