// Design tokens extracted from the Waseet .dc.html source.
// The source uses these exact values inline everywhere; centralising them here
// keeps the React port pixel-faithful while making the system reusable.

export const colors = {
  // text
  ink: '#0A0A0A', // primary text / near-black
  text: '#111827',
  textMuted: '#374151',
  textSoft: '#6B7280',
  textFaint: '#9CA3AF',

  // surfaces
  bg: '#FAFAFA', // app background
  surface: '#FFFFFF', // cards
  surfaceAlt: '#F9FAFB',
  surfaceMuted: '#F3F4F6',

  // borders
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // brand / accent (green)
  green: '#16A34A',
  greenDark: '#15803D',
  greenDarker: '#166534',
  greenTint: '#F0FDF4',
  greenTintBorder: '#BBF7D0',
  greenSoft: '#DCFCE7',

  // states
  amber: '#D97706',
  amberText: '#92400E',
  amberTint: '#FFFBEB',
  amberTintBorder: '#FDE68A',
  yellowTint: '#FEF9C3',

  red: '#DC2626',
  redTint: '#FFF5F5',
  redTintBorder: '#FECACA',
  redSoft: '#FEE2E2',

  blue: '#2563EB',
  blueTint: '#EFF6FF',
  blueTintBorder: '#BFDBFE',

  purple: '#7C3AED',
  purpleTint: '#F5F3FF',

  white: '#FFFFFF',
  black: '#000000',
}

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '7px',
  lg: '9px',
  xl: '12px',
  '2xl': '16px',
  pill: '999px',
}

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.03)',
  sm: '0 1px 3px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.06)',
  lg: '0 10px 30px rgba(0,0,0,0.08)',
  xl: '0 20px 50px rgba(0,0,0,0.12)',
}

export const font = {
  family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  tight: '-0.02em',
  snug: '-0.01em',
}

// Common typography helpers used across pages.
export const type = {
  h1: { fontSize: 22, fontWeight: 700, letterSpacing: font.tight },
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: font.tight },
  label: { fontSize: 12, fontWeight: 500, color: colors.textMuted },
  body: { fontSize: 13, color: colors.textMuted },
  small: { fontSize: 12, color: colors.textSoft },
  micro: { fontSize: 11, color: colors.textFaint },
}

export const layout = {
  sidebarWidth: 232,
  topbarHeight: 56,
  maxContent: 1200,
}

const theme = { colors, radius, shadow, font, type, layout }
export default theme
