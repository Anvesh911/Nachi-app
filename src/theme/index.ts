// src/theme/index.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// ─── Theme Types ──────────────────────────────────────────────────────────────

export type ThemeName = 'light' | 'purple' | 'dark' | 'amoled';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  purple: string;
  purple2: string;
  purple3: string;
  purplePale: string;
  neonBlue: string;
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
  // DEFAULT — light lavender (Daily Planner reference)
  light: {
    background:     '#F0EDFF',
    surface:        '#FFFFFF',
    surfaceVariant: '#F7F5FF',
    border:         '#E2DCFF',
    purple:         '#7C4DFF',
    purple2:        '#9C6FFF',
    purple3:        '#B794FF',
    purplePale:     '#EDE8FF',
    neonBlue:       '#4A90E2',
    orange:         '#FF7043',
    green:          '#43A047',
    red:            '#E53935',
    pink:           '#E91E8C',
    amber:          '#F9A825',
    textPrimary:    '#1A0F3C',
    textSecondary:  '#4A3F6B',
    textMuted:      '#9B8EC4',
    textDim:        '#C4B8E8',
    tagWork:        '#00897B',
    tagFamily:      '#E53935',
    tagFriend:      '#7C4DFF',
    tagHealth:      '#E91E8C',
    tagGeneral:     '#9B8EC4',
  },
  // Deep purple dark
  purple: {
    background:     '#1A0933',
    surface:        '#251244',
    surfaceVariant: '#1E0D3A',
    border:         '#3D2266',
    purple:         '#C084FC',
    purple2:        '#D4A0FF',
    purple3:        '#E2BCFF',
    purplePale:     '#2D1155',
    neonBlue:       '#818CF8',
    orange:         '#FB923C',
    green:          '#34D399',
    red:            '#F87171',
    pink:           '#F472B6',
    amber:          '#FBBF24',
    textPrimary:    '#FAF5FF',
    textSecondary:  '#DDD6FE',
    textMuted:      '#A78BFA',
    textDim:        '#7C3AED',
    tagWork:        '#34D399',
    tagFamily:      '#F87171',
    tagFriend:      '#C084FC',
    tagHealth:      '#F472B6',
    tagGeneral:     '#A78BFA',
  },
  // Navy dark
  dark: {
    background:     '#0C0E1A',
    surface:        '#13162A',
    surfaceVariant: '#0F1120',
    border:         '#1E2240',
    purple:         '#7C5CFC',
    purple2:        '#9C7CFF',
    purple3:        '#B89CFF',
    purplePale:     '#1A1640',
    neonBlue:       '#2DD4FF',
    orange:         '#FF9F43',
    green:          '#2ECC71',
    red:            '#FF4757',
    pink:           '#FD79A8',
    amber:          '#F9CA24',
    textPrimary:    '#FFFFFF',
    textSecondary:  '#B8C4D8',
    textMuted:      '#3D4A6B',
    textDim:        '#6B7FA3',
    tagWork:        '#00C9A7',
    tagFamily:      '#FF6B6B',
    tagFriend:      '#A29BFE',
    tagHealth:      '#FD79A8',
    tagGeneral:     '#636E72',
  },
  // Pure black
  amoled: {
    background:     '#000000',
    surface:        '#0A0A0F',
    surfaceVariant: '#050508',
    border:         '#1A1A28',
    purple:         '#7C5CFC',
    purple2:        '#9C7CFF',
    purple3:        '#B89CFF',
    purplePale:     '#0F0F20',
    neonBlue:       '#2DD4FF',
    orange:         '#FF9F43',
    green:          '#2ECC71',
    red:            '#FF4757',
    pink:           '#FD79A8',
    amber:          '#F9CA24',
    textPrimary:    '#FFFFFF',
    textSecondary:  '#B8C4D8',
    textMuted:      '#2A2A40',
    textDim:        '#4A4A6A',
    tagWork:        '#00C9A7',
    tagFamily:      '#FF6B6B',
    tagFriend:      '#A29BFE',
    tagHealth:      '#FD79A8',
    tagGeneral:     '#636E72',
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
  themeName: 'light',
  Colors: THEMES.light,

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

// ─── useColors hook ───────────────────────────────────────────────────────────

export function useColors(): ColorPalette {
  return useThemeStore((s) => s.Colors);
}

// ─── Static exports ───────────────────────────────────────────────────────────

export const Colors = THEMES.light;

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
  purple: {
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  red: {
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const THEME_LIST: { name: ThemeName; label: string; emoji: string }[] = [
  { name: 'light',  label: 'Lavender',     emoji: '☀️' },
  { name: 'purple', label: 'Deep Purple',  emoji: '💜' },
  { name: 'dark',   label: 'Dark Navy',    emoji: '🌙' },
  { name: 'amoled', label: 'AMOLED Black', emoji: '⚫' },
];
