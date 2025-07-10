import { createTokens } from 'tamagui'
import { zIndex } from '@tamagui/themes'
import { flattenPalette } from '@/src/theme/helpers/utils'
import lightPalette from '@/src/theme/palettes/lightPalette'
import darkPalette from '@/src/theme/palettes/darkPalette'
const colors = {
  ...flattenPalette(lightPalette, { suffix: 'Light' }),
  ...flattenPalette(darkPalette, { suffix: 'Dark' }),
}

export const radius = {
  0: 0,
  1: 3,
  2: 5,
  3: 7,
  4: 9,
  true: 9,
  5: 10,
  6: 16,
  7: 19,
  8: 22,
  9: 24,
  10: 34,
  11: 42,
  12: 50,
}

export const fontSizes = {
  1: 11,
  2: 12,
  3: 13,
  4: 14,
  true: 14,
  $sm: 14,
  $md: 14,
  $xl: 14,
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
}

export const tokens = createTokens({
  color: colors,
  space: {
    $1: 4,
    $2: 8,
    true: 8,
    $3: 12,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 28,
    $8: 32,
    $9: 36,
    $10: 40,
  },
  // space,
  size: {
    $1: 4,
    $2: 8,
    true: 8,
    $3: 12,
    $4: 16,
    $5: 20,
    $6: 24,
    $7: 28,
    $8: 32,
    $9: 36,
    $10: 40,
    $xl: 14,
    $md: 14,
    $sm: 14,
  },
  zIndex,
  radius,
})
