import type { ColorPalette } from './types'

const gta6Palette = {
  text: {
    primary: '#FFF3FA',
    secondary: '#C9B4D3',
    disabled: '#9D83AF',
    contrast: '#210F28',
  },
  primary: {
    dark: '#F065AC',
    main: '#FF92CC',
    light: '#FFC0DF',
  },
  secondary: {
    dark: '#BFA6CB',
    main: '#FFD0A6',
    light: '#B0FFC9',
    background: '#412442',
  },
  border: {
    main: '#836386',
    light: '#503655',
    background: '#170F24',
  },
  background: {
    default: '#170F24',
    main: '#170F24',
    sheet: '#20142F',
    paper: '#281A36',
    light: '#3D2244',
    lightHover: '#4D2D53',
    secondary: '#352345',
    skeleton: '#FFF3FA12',
    disabled: '#FFF3FA1F',
  },
  logo: {
    main: '#FFF3FA',
    background: '#3D2244',
  },
  static: {
    main: '#170F24',
    light: '#503655',
    primary: '#FFF3FA',
    textSecondary: '#C9B4D3',
    textBrand: '#FF92CC',
  },
} satisfies Partial<ColorPalette>

export default gta6Palette
