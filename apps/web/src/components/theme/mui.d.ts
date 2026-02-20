/**
 * MUI theme type extensions for Safe Wallet.
 * These declarations extend MUI's theme types to include custom palette colors.
 */

import '@mui/material/styles'

declare module '@mui/material/styles' {
  // Custom color palettes
  interface Palette {
    border: Palette['primary']
    logo: Palette['primary']
    backdrop: Palette['primary']
    static: Palette['primary']
  }

  interface PaletteOptions {
    border: PaletteOptions['primary']
    logo: PaletteOptions['primary']
    backdrop: PaletteOptions['primary']
    static: PaletteOptions['primary']
  }

  interface TypeBackground {
    main: string
    light: string
    lightGrey: string
    secondary: string
    skeleton: string
    disabled: string
  }

  // Custom color properties
  interface PaletteColor {
    background?: string
  }

  interface SimplePaletteColorOptions {
    background?: string
  }
}

declare module '@mui/material/SvgIcon' {
  interface SvgIconPropsColorOverrides {
    border: true
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsSizeOverrides {
    xlarge: true
    // @deprecated - Remove in next major version
    stretched: true
    // @deprecated - Remove in next major version
    compact: true
  }

  interface ButtonPropsColorOverrides {
    background: true
    static: true
    'background.paper': true
  }

  interface ButtonPropsVariantOverrides {
    danger: true
    neutral: true
  }
}

declare module '@mui/material/IconButton' {
  interface IconButtonPropsColorOverrides {
    border: true
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsSizeOverrides {
    tiny: true
  }
}

declare module '@mui/material/Alert' {
  interface AlertPropsColorOverrides {
    background: true
  }
}
