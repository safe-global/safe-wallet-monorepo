/**
 * Web palettes: the unified palettes with the web-only colours that differ from mobile.
 * Used by the web CSS generators (vars.css, @safe-global/ui tokens); MUI and Tamagui do not read them.
 */

import type { ColorPalette } from './types'
import lightPalette from './light'
import darkPalette from './dark'

export const webLightPalette: ColorPalette = {
  ...lightPalette,
  background: {
    ...lightPalette.background,
    paper: '#FFFFFF',
    default: '#F4F4F4',
  },
  error: {
    dark: '#AC2C3B',
    main: '#FF5F72',
    light: '#FFB4BD',
    background: '#FFE6EA',
  },
  success: {
    dark: '#028D4C',
    main: '#00B460',
    light: '#D3F2E4',
    background: '#EFFAF1',
  },
  info: {
    dark: '#52BFDC',
    main: '#5FDDFF',
    light: '#D7F6FF',
    background: '#EFFCFF',
  },
  warning: {
    dark: '#C04C32',
    main: '#FF8061',
    light: '#FFBC9F',
    background: '#FFF1E0',
  },
}

export const webDarkPalette: ColorPalette = {
  ...darkPalette,
  error: {
    dark: '#AC2C3B',
    main: '#FF5F72',
    light: '#FFB4BD',
    background: '#2F2527',
  },
  success: {
    dark: '#388E3C',
    main: '#00B460',
    light: '#81C784',
    background: '#1F2920',
  },
  info: {
    dark: '#52BFDC',
    main: '#5FDDFF',
    light: '#B7F0FF',
    background: '#19252C',
  },
  warning: {
    dark: '#C04C32',
    main: '#FF8061',
    light: '#FFBC9F',
    background: '#2F2318',
  },
}
