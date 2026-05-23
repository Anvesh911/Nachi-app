// src/theme/index.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// ─── Theme Types ──────────────────────────────────────────────────────────────

export type ThemeName = 'dark' | 'amoled' | 'neon' | 'light';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  neonBlue: string;
  purple: string;
  orange: string;
  green: string;
  red: string;
  pink: string;
  amber: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  tagWork: string;
  tagFamily: string;
  tagFriend: string;
  tagHealth: string;
  tagGeneral: string;
}

// ─── 4 Themes ─────────────────────────────────────────────────────────────────

const THEMES: Record<ThemeName, ColorPalette> = {
  dark: {
    background:     '#070B14',
    surface:        '#0D1117',
    surfaceVariant: '#0A0E1A',
    border:         '#1A2035',
    neonBlue:       '#00B4FF',
    purple:         '#7C5CFC',
    orange:         '#FF9F43',
    green:          '#55EFC4',
    red:            '#FF4757',
    pink:           '#FD79A8',
    amber:          '#FFC107',
    textPrimary:    '#F0F4FF',
    textSecondary:  '#C8D6E5',
    textMuted:      '#4A5568',
    textDim:        '#8899AA',
    tagWork:        '#00D4AA',
    tagFamily:      '#FF6B6B',
    tagFriend:      '#A29BFE',
    tagHealth:      '#FD79A8',
    tagGeneral:     '#636E72',
  },
  amoled: {
    background:     '#000000',
    surface:        '#0A0A0A',
    surfaceVariant: '#050505',
    border:         '#1A1A1A',
    neonBlue:       '#00B4FF',
    purple:         '#7C5CFC',
    orange:         '#FF9F43',
    green:          '#55EFC4',
    red:            '#FF4757',
    pink:           '#FD79A8',
    amber:          '#FFC107',
    textPrimary:    '#FFFFFF',
    textSecondary:  '#CCCCCC',
    textMuted:      '#555555',
    textDim:        '#888888',
    tagWork:        '#00D4AA',
    tagFamily:      '#FF6B6B',
    tagFriend:      '#A29BFE',
    tagHealth:      '#FD79A8',
    tagGeneral:     '#636E72',
  },
  neon: {
    background:     '#03001C',
    surface:        '#05002E',
    surfaceVariant: '#07003A',
    border:         '#1A005A',
    neonBlue:       '#00FFFF',
    purple:         '#BF00FF',
    orange:         '#FF6600',
    green:          '#00FF88',
    red:            '#FF0055',
    pink:           '#FF00AA',
    amber:          '#FFD700',
    textPrimary:    '#E0F0FF',
    textSecondary:  '#A0C8FF',
    textMuted:      '#3A4A7A',
    textDim:        '#5A7AAA',
    tagWork:        '#00FFCC',
    tagFamily:      '#FF4466',
    tagFriend:      '#CC88FF',
    tagHealth:      '#FF66CC',
    tagGeneral:     '#5588AA',
  },
  light: {
    background:     '#F5F7FA',
    surface:        '#FFFFFF',
    surfaceVariant: '#EEF1F6',
    border:         '#DDE3EE',
    neonBlue:       '#0088CC',
    purple:         '#6644CC',
    orange:         '#E07000',
    green:          '#008866',
    red:            '#CC2233',
    pink:           '#CC4488',
    amber:          '#CC8800',
    textPrimary:    '#0A0E1A',
    textSecondary:  '#2A3A5A',
    textMuted:      '#8899AA',
    textDim:        '#6677AA',
    tagWork:        '#00AA88',
    tagFamily:      '#CC4444',
    tagFriend:      '#7755CC',
    tagHealth:      '#CC4488',
    tagGeneral:     '#778899',
  },
};

const THEME_KEY = 'anvy_theme';

// ─── Theme Store ──────────────────────────────────────────────────────────────

interface ThemeStore {
  themeName: ThemeName;
  Colors: ColorPalette;
  loadTheme: () => Promise<void>;
  setTheme: (name: ThemeName) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  themeName: 'dark',
  Colors: THEMES.dark,

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY) as ThemeName | null;
      if (saved && THEMES[saved]) {
        set({ themeName: saved, Colors: THEMES[saved] });
      }
    } catch (_) {}
  },

  setTheme: async (name: ThemeName) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, name);
      set({ themeName: name, Colors: THEMES[name] });
    } catch (_) {}
  },
}));

export const THEME_LIST: { name: ThemeName; label: string; emoji: string }[] = [
  { name: 'dark',   label: 'Dark',         emoji: '🌙' },
  { name: 'amoled', label: 'AMOLED Black', emoji: '⚫' },
  { name: 'neon',   label: 'Blue Neon',    emoji: '💙' },
  { name: 'light',  label: 'Light',        emoji: '☀️' },
];

// ─── Static exports (default dark) ───────────────────────────────────────────
// These are kept so existing screens don't break before you update them

export const Colors = THEMES.dark;

export const Typography = {
  displayXL: { fontFamily: 'Sora_800ExtraBold', fontSize: 36, letterSpacing: -0.5 },
  displayL:  { fontFamily: 'Sora_700Bold',      fontSize: 28 },
  displayM:  { fontFamily: 'Sora_700Bold',      fontSize: 22 },
  headingL:  { fontFamily: 'Sora_700Bold',      fontSize: 18 },
  headingM:  { fontFamily: 'Sora_600SemiBold',  fontSize: 16 },
  headingS:  { fontFamily: 'Sora_600SemiBold',  fontSize: 14 },
  bodyL:     { fontFamily: 'Sora_400Regular',   fontSize: 14, lineHeight: 22 },
  bodyM:     { fontFamily: 'Sora_400Regular',   fontSize: 13, lineHeight: 20 },
  bodyS:     { fontFamily: 'Sora_400Regular',   fontSize: 12 },
  label:     { fontFamily: 'Sora_600SemiBold',  fontSize: 11, letterSpacing: 1.5 },
  mono:      { fontFamily: 'Sora_800ExtraBold', fontSize: 48, letterSpacing: 2 },
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 999,
} as const;

export const Shadow = {
  neonBlue: {
    shadowColor: Colors.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  red: {
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
