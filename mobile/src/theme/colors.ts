
export const Colors = {
  // ── Brand ──
  primary: '#FE2C55',
  primaryLight: 'rgba(254, 44, 85, 0.15)',
  accent: '#25F4EE',

  // ── Backgrounds ──
  background: '#0F0F13',
  surface: '#1C1C24',
  elevated: '#25252F',
  card: '#12121A',

  // ── Borders ──
  border: '#2D2D3A',
  borderLight: 'rgba(255, 255, 255, 0.08)',

  // ── Text ──
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textDim: '#6B7280',
  textGhost: '#4B5563',

  // ── Semantic ──
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Overlays ──
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // ── Misc ──
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
