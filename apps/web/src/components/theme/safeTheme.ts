import type { PaletteMode } from '@mui/material'
import { generateMuiTheme, spacingWebBase } from '@safe-global/theme'

// Re-export MUI type extensions from theme package
import '@safe-global/theme/generators/mui-extensions'

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
