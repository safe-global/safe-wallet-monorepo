/**
 * Typography tokens for Safe Wallet theme.
 * Unified font family, sizes, and variants across web and mobile.
 */

/**
 * Font family used across all platforms.
 */
export const fontFamily = 'DM Sans, sans-serif'

/**
 * Font size scale (in pixels).
 * Used by both web and mobile for consistent sizing.
 */
export const fontSizes = {
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  5: 16,
  6: 18,
  7: 20,
  8: 23,
  9: 30,
  10: 44,
  11: 55,
  12: 62,
  13: 72,
  14: 92,
  15: 114,
  16: 134,
} as const

/**
 * Typography variant definitions for MUI and general use.
 * Includes font size, line height, weight, and other properties.
 */
export const typographyVariants = {
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: 700,
  },
  h2: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: 700,
  },
  h3: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 400,
  },
  h4: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 400,
  },
  h5: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 700,
  },
  body1: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 400,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 400,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontWeight: 400,
  },
  overline: {
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    fontWeight: 400,
  },
} as const

/**
 * Complete typography configuration.
 */
export const typography = {
  fontFamily,
  fontSizes,
  variants: typographyVariants,
} as const
