import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useApp } from '@/context/AppProvider';
import { FONTS, palettes, type ColorScheme, type Palette } from './colors';

interface ThemeValue {
  colors: Palette;
  isDark: boolean;
  scheme: ColorScheme;
  fonts: typeof FONTS;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { state } = useApp();
  const preference = state.settings.theme;

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({
      colors: palettes[scheme],
      isDark: scheme === 'dark',
      scheme,
      fonts: FONTS,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
