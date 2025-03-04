import { createTokens } from 'tamagui'
import { radius, zIndex } from '@tamagui/themes'
import { flattenPalette } from '@/src/theme/helpers/utils'
import lightPalette from '@/src/theme/palettes/lightPalette'
import darkPalette from '@/src/theme/palettes/darkPalette'
const colors = {
  ...flattenPalette(lightPalette, { suffix: 'Light' }),
  ...flattenPalette(darkPalette, { suffix: 'Dark' }),
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
    $md: 14,
    $sm: 14,
  },
  zIndex,
  radius,
})
