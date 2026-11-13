import type { ColorPalette } from './types'

/**
 * Unified dark mode color palette.
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const darkPalette: ColorPalette = {
  text: {
    primary: '#FFFFFF',
    secondary: '#636669',
    disabled: 'rgba(255, 255, 255, 0.3)',
    contrast: '#000000',
  },
  primary: {
    dark: '#0cb259',
    main: '#12FF80',
    light: '#A1A3A7',
  },
  secondary: {
    dark: '#636669',
    main: '#FFFFFF',
    light: '#B0FFC9',
    background: '#1B2A22',
  },
  border: {
    main: '#636669',
    light: '#303033',
    background: '#121312',
  },
  error: {
    dark: '#FFE0E6',
    main: '#FF5F72',
    light: '#4A2125',
    background: '#4A2125',
  },
  error1: {
    main: '#4A2125',
    contrastText: '#FFE0E6',
  },
  success: {
    dark: '#DEFDEA',
    main: '#00B460',
    light: '#3B7A54',
    background: '#173026',
  },
  info: {
    dark: '#D9F4FB',
    main: '#00BFE5',
    light: '#458898',
    background: '#203339',
  },
  warning: {
    dark: '#FFE4CB',
    main: '#FF8C00',
    light: '#A65F34',
    background: '#4A3621',
  },
  warning1: {
    main: '#4A3621',
    text: '#FFE4CB',
    contrastText: '#FF8C00',
  },
  review: {
    main: '#D6A100',
    background: '#2F2A18',
  },
  // Tag colours (Figma Mint Refresh, dark mode, node 5-274).
  tag: {
    default: { background: '#303033', text: '#DCDEE0' },
    slate: { background: '#292E34', text: '#CDD5DE' },
    clay: { background: '#392A21', text: '#E7CFBF' },
    rose: { background: '#422232', text: '#F9C2DB' },
    orchid: { background: '#3D233C', text: '#EEC5EC' },
    lilac: { background: '#352644', text: '#DFC9F9' },
    iris: { background: '#262950', text: '#CAD1FF' },
    cobalt: { background: '#1A2D4E', text: '#BDD6FE' },
    sky: { background: '#0F3243', text: '#AEDCF6' },
    lagoon: { background: '#0D3530', text: '#A8E2D9' },
  },
  background: {
    default: '#121312',
    main: '#121312',
    sheet: '#121312',
    paper: '#1C1C1C',
    light: '#1B2A22',
    lightHover: '#12FF801A',
    secondary: '#303033',
    skeleton: 'rgba(255, 255, 255, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#636669',
  },
  logo: {
    main: '#FFFFFF',
    background: '#303033',
  },
  static: {
    main: '#121312',
    light: '#636669',
    primary: '#FFFFFF',
    textSecondary: '#A1A3A7',
    textBrand: '#12FF80',
  },
}

export default darkPalette
