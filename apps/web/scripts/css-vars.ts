import type { ColorPalette } from '../../../packages/theme/src/palettes/types'
import lightPalette from '../../../packages/theme/src/palettes/light'
import darkPalette from '../../../packages/theme/src/palettes/dark'
import { spacingWeb } from '../../../packages/theme/src/tokens/spacing'

function flattenPaletteToCSS(palette: ColorPalette, indent = '  '): string[] {
  const vars: string[] = []

  function flatten(obj: Record<string, unknown>, prefix = 'color'): void {
    if (typeof obj !== 'object' || obj === null) return

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        flatten(value as Record<string, unknown>, `${prefix}-${key}`)
      } else {
        vars.push(`${indent}--${prefix}-${key}: ${value};`)
      }
    })
  }

  flatten(palette as Record<string, unknown>)
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
