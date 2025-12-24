import type { PaletteMode } from '@mui/material'
// This import includes MUI type extensions via side-effect
import { generateMuiTheme, spacingWebBase } from '@safe-global/theme'

/** @deprecated Use spacingWebBase from @safe-global/theme instead */
export const base = spacingWebBase

/**
 * Create Safe-themed MUI theme for the given mode.
 * Uses the unified theme package.
 */
const createSafeTheme = (mode: PaletteMode) => {
  return generateMuiTheme(mode)
}

export default createSafeTheme
