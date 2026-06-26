// Theme-independent design tokens, shared across all palettes.
const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 14,
    full: 999,
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
};

export const darkColors = {
  background: '#0B0B0B',
  surface: '#141414',
  card: '#1A1A1A',
  border: '#272727',
  text: '#EDEAE0',
  subtext: '#7A7870',
  muted: '#404038',
  accent: '#C9954A',
  important: '#F0C040',
  destructive: '#C04040',
};

export const lightColors: typeof darkColors = {
  background: '#F7F5EF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E3DED2',
  text: '#1A1813',
  subtext: '#6B6457',
  muted: '#A8A294',
  accent: '#B07A2E',
  important: '#C2940E',
  destructive: '#B83232',
};

export type ThemeColors = typeof darkColors;
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof tokens.spacing;
  radius: typeof tokens.radius;
  fontSize: typeof tokens.fontSize;
}

export const darkTheme: Theme = { mode: 'dark', colors: darkColors, ...tokens };
export const lightTheme: Theme = { mode: 'light', colors: lightColors, ...tokens };

export const themes: Record<ThemeMode, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

// Back-compat default. Prefer useTheme() so styles react to changes.
export const theme = darkTheme;
