// src/theme/index.ts
// Converted from Flutter NachiColors + nachiTheme

export const Colors = {
  background:     '#070B14',
  surface:        '#0D1117',
  surfaceVariant: '#0A0E1A',
  border:         '#1A2035',

  neonBlue:  '#00B4FF',
  purple:    '#7C5CFC',
  orange:    '#FF9F43',
  green:     '#55EFC4',
  red:       '#FF4757',
  pink:      '#FD79A8',
  amber:     '#FFC107',

  textPrimary:   '#F0F4FF',
  textSecondary: '#C8D6E5',
  textMuted:     '#4A5568',
  textDim:       '#8899AA',

  // Tag colors
  tagWork:    '#00D4AA',
  tagFamily:  '#FF6B6B',
  tagFriend:  '#A29BFE',
  tagHealth:  '#FD79A8',
  tagGeneral: '#636E72',
} as const;

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
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  full: 999,
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
