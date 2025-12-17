import { createTokens } from 'tamagui'
import type { CreateTokens } from 'tamagui'
import { zIndex } from '@tamagui/themes'
import {
  generateTamaguiColorTokens,
  radius,
  generateTamaguiFontSizes,
  spacingMobile,
} from '@safe-global/theme'

// Generate color tokens from unified palettes
const colors = generateTamaguiColorTokens()

// Re-export radius for use in other files
export { radius }

// Re-export font sizes
export const fontSizes = generateTamaguiFontSizes()

// Create base tokens
const baseTokens = createTokens({
  color: colors,
  space: {
    ...spacingMobile,
    true: spacingMobile.$2, // Default spacing (8px)
  },
  size: {
    ...spacingMobile,
    true: spacingMobile.$2, // Default size (8px)
    $xl: 14,
    $md: 14,
    $sm: 14,
  },
  zIndex,
  radius: {
    ...radius,
    true: radius[4], // Default radius (9px)
  },
})

// Export with proper color token types for component themes
export const tokens = baseTokens as CreateTokens<{
  color: ReturnType<typeof generateTamaguiColorTokens>
  space: typeof baseTokens.space
  size: typeof baseTokens.size
  radius: typeof baseTokens.radius
  zIndex: typeof baseTokens.zIndex
}>
