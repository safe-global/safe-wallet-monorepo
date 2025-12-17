// Simple script to generate CSS variables
// This is a workaround for ESM/TypeScript import issues

const lightPalette = {
  text: { primary: '#121312', secondary: '#A1A3A7', disabled: '#DDDEE0', contrast: '#FFFFFF' },
  primary: { dark: '#3c3c3c', main: '#121312', light: '#636669' },
  secondary: { dark: '#0FDA6D', main: '#12FF80', light: '#B0FFC9', background: '#EFFFF4' },
  border: { main: '#A1A3A7', light: '#DCDEE0', background: '#F4F4F4' },
  error: { dark: '#8A1C27', main: '#FF5F72', light: '#F79BA7', background: '#FFE0E6' },
  error1: { main: '#FFE0E6', contrastText: '#8A1C27' },
  success: { dark: '#1C5538', main: '#00B460', light: '#84D9A0', background: '#CBF2DB' },
  info: { dark: '#15566A', main: '#00BFE5', light: '#78D2E7', background: '#CEF0FD' },
  warning: { dark: '#6C2D19', main: '#FF8C00', light: '#F9B37C', background: '#FFECC2' },
  warning1: { main: '#FFECC2', text: '#6C2D19', contrastText: '#FF8C00' },
  background: { default: '#FFFFFF', main: '#F4F4F4', paper: '#F4F4F4', light: '#EFFFF4', secondary: '#DDDEE0', skeleton: 'rgba(0, 0, 0, 0.04)', disabled: '#7878801F' },
  backdrop: { main: '#636669' },
  logo: { main: '#121312', background: '#EEEFF0' },
  static: { main: '#121312' }
}

const darkPalette = {
  text: { primary: '#FFFFFF', secondary: '#636669', disabled: '#636669', contrast: '#000000' },
  primary: { dark: '#0cb259', main: '#12FF80', light: '#A1A3A7' },
  secondary: { dark: '#636669', main: '#FFFFFF', light: '#B0FFC9', background: '#1B2A22' },
  border: { main: '#636669', light: '#303033', background: '#121312' },
  error: { dark: '#FFE0E6', main: '#FF5F72', light: '#4A2125', background: '#4A2125' },
  error1: { main: '#4A2125', contrastText: '#FFE0E6' },
  success: { dark: '#DEFDEA', main: '#00B460', light: '#3B7A54', background: '#173026' },
  info: { dark: '#D9F4FB', main: '#00BFE5', light: '#458898', background: '#203339' },
  warning: { dark: '#FFE4CB', main: '#FF8C00', light: '#A65F34', background: '#4A3621' },
  warning1: { main: '#4A3621', text: '#FFE4CB', contrastText: '#FF8C00' },
  background: { default: '#121312', main: '#121312', paper: '#1C1C1C', light: '#1B2A22', secondary: '#303033', skeleton: 'rgba(255, 255, 255, 0.04)', disabled: '#7878801F' },
  backdrop: { main: '#636669' },
  logo: { main: '#FFFFFF', background: '#303033' },
  static: { main: '#121312' }
}

const spacingWeb = { 1: 8, 2: 16, 3: 24, 4: 32, 5: 40, 6: 48, 7: 56, 8: 64, 9: 72, 10: 80, 11: 88, 12: 96 }

function flattenPaletteToCSS(palette, indent = '  ') {
  const vars = []
  function flatten(obj, prefix = 'color') {
    if (typeof obj !== 'object' || obj === null) return
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        flatten(value, `${prefix}-${key}`)
      } else {
        vars.push(`${indent}--${prefix}-${key}: ${value};`)
      }
    })
  }
  flatten(palette)
  return vars
}

function generateSpacingCSS(indent = '  ') {
  return Object.entries(spacingWeb).map(([key, value]) => `${indent}--space-${key}: ${value}px;`)
}

const lightVars = flattenPaletteToCSS(lightPalette)
const darkVars = flattenPaletteToCSS(darkPalette)
const spacingVars = generateSpacingCSS()

const css = `/* This file is generated from @safe-global/theme. Do not edit directly. */

:root {
${lightVars.join('\n')}
${spacingVars.join('\n')}
}

[data-theme="dark"] {
${darkVars.join('\n')}
}

/* The same as above for the brief moment before JS loads */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${darkVars.map(v => '  ' + v).join('\n')}
  }
}
`

console.log(css)
