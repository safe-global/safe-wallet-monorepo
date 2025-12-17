import type { StaticColors } from './types'

/**
 * Static colors that remain constant regardless of light/dark theme mode.
 * Used for consistent brand elements and specific UI components that should
 * not change appearance when theme switches.
 */
const staticColors: StaticColors = {
  main: '#121312',
  light: '#636669',
  primary: '#FFFFFF',
  textSecondary: '#A1A3A7',
  textBrand: '#12FF80',
}

export default staticColors
