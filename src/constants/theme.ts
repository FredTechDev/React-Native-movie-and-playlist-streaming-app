/**
 * Enhanced Design System for Netstream — Production-Grade Video Platform
 * Fully harmonized color palette with cinematic dark mode feel.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0A0F',
    background: '#F8F8FC',
    backgroundElement: '#EDEEF3',
    backgroundSelected: '#DDDFE8',
    textSecondary: '#5A5E72',
    accent: '#E50914',
    accentGold: '#E1AD01',
    accentGreen: '#00C853',
    surface: '#FFFFFF',
    border: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#F5F5F7',
    background: '#0A0A0F',
    backgroundElement: '#141418',
    backgroundSelected: '#1E1E25',
    textSecondary: '#8A8FA8',
    accent: '#E50914',
    accentGold: '#E1AD01',
    accentGreen: '#00C853',
    surface: '#141418',
    border: 'rgba(255,255,255,0.06)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Shadow presets for cards & modals
export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 12,
    },
    android: { elevation: 8 },
    default: {},
  }) || {},
  subtle: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
    android: { elevation: 3 },
    default: {},
  }) || {},
};
