/**
 * Spacing tokens for Safe Wallet theme.
 * Maintains dual spacing systems for platform compatibility.
 */

/**
 * Mobile spacing system (4px base).
 * Used by Tamagui and mobile components.
 */
export const spacingMobile = {
  $0: 0,
  $1: 4,
  $2: 8,
  $3: 12,
  $4: 16,
  $5: 20,
  $6: 24,
  $7: 28,
  $8: 32,
  $9: 36,
  $10: 40,
} as const

/**
 * Web spacing system (8px base).
 * Used by MUI theme and CSS custom properties.
 * Generates: space-1=8px, space-2=16px, ..., space-12=96px
 */
export const spacingWeb = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 56,
  8: 64,
  9: 72,
  10: 80,
  11: 88,
  12: 96,
} as const

/**
 * Base unit for web spacing (8px).
 * Used by MUI's spacing function.
 */
export const spacingWebBase = 8

/**
 * Base unit for mobile spacing (4px).
 * Used by Tamagui's space tokens.
 */
export const spacingMobileBase = 4
