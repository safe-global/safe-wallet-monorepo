/**
 * Type definitions for theme generators.
 */

import type { Theme as MuiTheme } from '@mui/material'

export type ThemeMode = 'light' | 'dark'

export interface MuiThemeGeneratorOptions {
  mode: ThemeMode
}

export type GeneratedMuiTheme = MuiTheme
