/**
 * Border radius tokens for Safe Wallet theme.
 * Used for consistent corner rounding across web and mobile.
 */

/**
 * Border radius scale (in pixels).
 * Used by both Tamagui and MUI for consistent rounded corners.
 */
export const radius = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 9,
  5: 10,
  6: 16,
  7: 19,
  8: 22,
  9: 24,
  10: 34,
  11: 42,
  12: 50,
} as const

/**
 * Default border radius for MUI components (6px).
 */
export const defaultRadius = 6
