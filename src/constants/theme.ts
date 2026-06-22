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
    overlay: 'rgba(0,0,0,0.5)',
  },
  dark: {
    text: '#F5F5F7',
    background: '#000000',
    backgroundElement: '#0A0A0B',
    backgroundSelected: '#1A1A1E',
    textSecondary: '#8A8FA8',
    accent: '#E50914',
    accentGold: '#E1AD01',
    accentGreen: '#00C853',
    surface: '#0F0F12',
    border: 'rgba(255,255,255,0.06)',
    overlay: 'rgba(0,0,0,0.8)',
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
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
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

export const Cinematic = {
  overlayStart: 'rgba(0,0,0,0.92)',
  overlayMid: 'rgba(0,0,0,0.4)',
  overlayEnd: 'transparent',
  heroGradient: {
    top: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.6)' } as const,
    bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' as any, backgroundColor: 'rgba(0,0,0,0)' },
  },
  cardElevation: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 10,
  },
  cardHover: {
    shadowColor: '#E50914',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.6,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
    },
    android: { elevation: 10 },
    default: {},
  }) || {},
  subtle: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }) || {},
  glow: Platform.select({
    ios: {
      shadowColor: '#E50914',
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 20,
    },
    android: { elevation: 8 },
    default: {},
  }) || {},
};
