import lightPalette from '../../../packages/theme/src/palettes/light'
import darkPalette from '../../../packages/theme/src/palettes/dark'
import { spacingWeb } from '../../../packages/theme/src/tokens/spacing'

function flattenPaletteToCSS(palette: any, indent = '  '): string[] {
  const vars: string[] = []

  function flatten(obj: any, prefix = 'color'): void {
    if (typeof obj !== 'object' || obj === null) return

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && key !== 'static') {
        flatten(value, `${prefix}-${key}`)
      } else if (key !== 'static') {
        vars.push(`${indent}--${prefix}-${key}: ${value};`)
      }
    })
  }

  flatten(palette)
  return vars
}

function generateSpacingCSS(indent = '  '): string[] {
  return Object.entries(spacingWeb).map(([key, value]) => {
    return `${indent}--space-${key}: ${value}px;`
  })
}

function generateCSSVars(): string {
  const lightVars = flattenPaletteToCSS(lightPalette)
  const darkVars = flattenPaletteToCSS(darkPalette)
  const spacingVars = generateSpacingCSS()

  return `/* This file is generated from @safe-global/theme. Do not edit directly. */

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
${darkVars.map((v) => '  ' + v).join('\n')}
  }
}
`
}

const css = generateCSSVars()
console.log(css)
