/**
 * Unified color palette type for Safe Wallet theme system.
 * Supports both light and dark modes.
 */
export interface ColorPalette {
  text: {
    primary: string
    secondary: string
    disabled: string
    contrast: string
  }
  primary: {
    dark: string
    main: string
    light: string
  }
  secondary: {
    dark: string
    main: string
    light: string
    background: string
  }
  border: {
    main: string
    light: string
    background: string
  }
  error: {
    dark: string
    main: string
    light: string
    background: string
  }
  error1: {
    main: string
    contrastText: string
  }
  success: {
    dark: string
    main: string
    light: string
    background: string
  }
  info: {
    dark: string
    main: string
    light: string
    background: string
  }
  warning: {
    dark: string
    main: string
    light: string
    background: string
  }
  warning1: {
    main: string
    text: string
    contrastText: string
  }
  background: {
    default: string
    main: string
    sheet: string
    paper: string
    light: string
    secondary: string
    skeleton: string
    disabled: string
  }
  backdrop: {
    main: string
  }
  logo: {
    main: string
    background: string
  }
  static: {
    main: string
    light: string
    primary: string
    textSecondary: string
    textBrand: string
  }
}

/**
 * Static colors that don't change with theme mode.
 * Used for consistent brand elements across light and dark themes.
 */
export interface StaticColors {
  main: string
  light: string
  primary: string
  textSecondary: string
  textBrand: string
}
