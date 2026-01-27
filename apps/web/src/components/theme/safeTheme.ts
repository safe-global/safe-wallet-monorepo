import type { PaletteMode } from '@mui/material'
// This import includes MUI type extensions via side-effect
import { generateMuiTheme } from '@safe-global/theme'

/**
 * Create Safe-themed MUI theme for the given mode.
 * Uses the unified theme package.
 */
const createSafeTheme = (mode: PaletteMode) => {
  return generateMuiTheme(mode)
}

export default createSafeTheme
