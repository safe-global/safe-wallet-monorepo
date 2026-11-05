import type { ColorPalette } from './types'

/**
 * Unified light mode color palette.
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const lightPalette: ColorPalette = {
  text: {
    primary: '#121312',
    secondary: '#A1A3A7',
    disabled: '#DDDEE0',
    contrast: '#FFFFFF',
  },
  primary: {
    dark: '#3c3c3c',
    main: '#121312',
    light: '#636669',
  },
  secondary: {
    dark: '#0FDA6D',
    main: '#12FF80',
    light: '#B0FFC9',
    background: '#EFFFF4',
  },
  border: {
    main: '#A1A3A7',
    light: '#DCDEE0',
    background: '#F4F4F4',
  },
  error: {
    dark: '#8A1C27',
    main: '#FF5F72',
    light: '#F79BA7',
    background: '#FFE0E6',
  },
  error1: {
    main: '#FFE0E6',
    contrastText: '#8A1C27',
  },
  success: {
    dark: '#1C5538',
    main: '#00B460',
    light: '#84D9A0',
    background: '#CBF2DB',
  },
  info: {
    dark: '#15566A',
    main: '#00BFE5',
    light: '#78D2E7',
    background: '#CEF0FD',
  },
  warning: {
    dark: '#6C2D19',
    main: '#FF8C00',
    light: '#F9B37C',
    background: '#FFECC2',
  },
  warning1: {
    main: '#FFECC2',
    text: '#6C2D19',
    contrastText: '#FF8C00',
  },
  review: {
    main: '#D6A100',
    background: '#FFF8CC',
  },
  background: {
    default: '#FFFFFF',
    main: '#F4F4F4',
    sheet: '#F4F4F4',
    paper: '#FFFFFF',
    light: '#EFFFF4',
    lightHover: '#E7FFF2',
    secondary: '#DDDEE0',
    skeleton: 'rgba(0, 0, 0, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#636669',
  },
  logo: {
    main: '#121312',
    background: '#EEEFF0',
  },
  static: {
    main: '#121312',
    light: '#636669',
    primary: '#FFFFFF',
    textSecondary: '#A1A3A7',
    textBrand: '#12FF80',
  },
  tag: {
    slate: { fg: '#4F5C6B', bg: '#F0F4F7', dot: '#7D8EA0' },
    clay: { fg: '#775136', bg: '#FBF1EB', dot: '#B08060' },
    rose: { fg: '#8E3665', bg: '#FFEEF5', dot: '#CD6199' },
    lilac: { fg: '#6F4198', bg: '#F7F2FE', dot: '#AF7DE1' },
    iris: { fg: '#403CAA', bg: '#EBEEFE', dot: '#5551D8' },
    cobalt: { fg: '#184DA3', bg: '#E9F1FE', dot: '#276EE1' },
    sky: { fg: '#086990', bg: '#EDF8FE', dot: '#3CB1E9' },
    lagoon: { fg: '#05665D', bg: '#DFFBF6', dot: '#199A8D' },
  },
}

export default lightPalette
