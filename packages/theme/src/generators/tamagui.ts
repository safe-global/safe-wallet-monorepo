/**
 * Tamagui tokens and themes generator for mobile application.
 * Generates tokens and theme configurations for Tamagui.
 */

import { flattenPalette } from '../utils/flatten'
import lightPalette from '../palettes/light'
import darkPalette from '../palettes/dark'
import { spacingMobile, radius, fontSizes } from '../tokens'

/**
 * Type for Tamagui token values - compatible with createTokens input.
 * Matches Tamagui's CreateTokens type structure.
 */
type TokenValue = string | number
type TokenCategory = Record<string, TokenValue>

export interface TamaguiTokensInput {
  color: TokenCategory
  space: TokenCategory
  size: TokenCategory
  radius: TokenCategory
  zIndex?: TokenCategory
}

/**
 * Generate Tamagui color tokens from light and dark palettes.
 * Returns flattened color objects with Light and Dark suffixes.
 */
export function generateTamaguiColorTokens() {
  return {
    ...flattenPalette(lightPalette, { suffix: 'Light' }),
    ...flattenPalette(darkPalette, { suffix: 'Dark' }),
  }
}

/**
 * Generate complete Tamagui tokens including colors, spacing, sizes, and radius.
 * Compatible with Tamagui's createTokens API.
 */
export function generateTamaguiTokens(): TamaguiTokensInput {
  return {
    color: generateTamaguiColorTokens(),
    space: {
      ...spacingMobile,
      true: spacingMobile.$2, // Default spacing
    },
    size: {
      ...spacingMobile,
      true: spacingMobile.$2, // Default size
      // Additional size variants for components
      $sm: 14,
      $md: 14,
      $xl: 14,
    },
    radius: {
      ...radius,
      true: radius[4], // Default radius (9px)
    },
  }
}

/**
 * Generate Tamagui theme objects for light and dark modes.
 * Returns theme configurations ready for use in Tamagui's createTamagui.
 */
export function generateTamaguiThemes() {
  const lightColors = flattenPalette(lightPalette, { suffix: 'Light' })
  const darkColors = flattenPalette(darkPalette, { suffix: 'Dark' })

  return {
    light: lightColors,
    dark: darkColors,
  }
}

/**
 * Generate font size tokens for Tamagui.
 */
export function generateTamaguiFontSizes() {
  return {
    ...fontSizes,
    true: fontSizes[4], // Default font size (14px)
    $sm: 14,
    $md: 14,
    $xl: 14,
  }
}
