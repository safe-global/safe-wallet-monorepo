import type { PaletteMode } from '@mui/material'
import { generateMuiTheme } from '@safe-global/theme'

declare module '@mui/material/styles' {
  // Custom color palettes
  export interface Palette {
    border: Palette['primary']
    logo: Palette['primary']
    backdrop: Palette['primary']
    static: Palette['primary']
  }

  export interface PaletteOptions {
    border: PaletteOptions['primary']
    logo: PaletteOptions['primary']
    backdrop: PaletteOptions['primary']
    static: PaletteOptions['primary']
  }

  export interface TypeBackground {
    main: string
    light: string
    lightGrey: string
    secondary: string
    skeleton: string
    disabled: string
  }

  // Custom color properties
  export interface PaletteColor {
    background?: string
  }

  export interface SimplePaletteColorOptions {
    background?: string
  }
}

declare module '@mui/material/SvgIcon' {
  export interface SvgIconPropsColorOverrides {
    border: unknown
  }
}

declare module '@mui/material/Button' {
  export interface ButtonPropsSizeOverrides {
    stretched: true
    compact: true
  }

  export interface ButtonPropsColorOverrides {
    background: true
    static: true
    'background.paper': true
  }

  export interface ButtonPropsVariantOverrides {
    danger: true
    neutral: true
  }
}

declare module '@mui/material/IconButton' {
  export interface IconButtonPropsColorOverrides {
    border: true
  }
}

declare module '@mui/material/Chip' {
  export interface ChipPropsSizeOverrides {
    tiny: true
  }
}

declare module '@mui/material/Alert' {
  export interface AlertPropsColorOverrides {
    background: true
  }
}

/**
 * Create Safe-themed MUI theme for the given mode.
 * Uses the unified theme package.
 */
const createSafeTheme = (mode: PaletteMode) => {
  return generateMuiTheme(mode)
}

export default createSafeTheme
