// Main exports for @safe-global/theme package

// Palettes
export { default as lightPalette } from './palettes/light'
export { default as darkPalette } from './palettes/dark'
export { default as staticColors } from './palettes/static'
export type { ColorPalette, StaticColors } from './palettes/types'

// Tokens
export * from './tokens'

// Generators
export { generateMuiTheme } from './generators/mui'
export {
  generateTamaguiColorTokens,
  generateTamaguiTokens,
  generateTamaguiThemes,
  generateTamaguiFontSizes,
} from './generators/tamagui'
export { generateCSSVars } from './generators/css-vars'

// Utilities
export { flattenPalette } from './utils/flatten'
