import type { PaletteMode } from '@mui/material'
// MUI type extensions (module augmentation for custom palette colors, button variants, etc.)
import '@safe-global/theme/generators/mui-extensions'
import { generateMuiTheme } from '@safe-global/theme/generators/mui'

/**
 * Create Safe-themed MUI theme for the given mode.
 * Uses the unified theme package.
 */
const createSafeTheme = (mode: PaletteMode) => {
  return generateMuiTheme(mode)
}

export default createSafeTheme
