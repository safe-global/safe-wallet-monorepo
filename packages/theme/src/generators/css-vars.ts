/**
 * CSS custom properties generator for web application.
 * Generates CSS variables file (vars.css) from unified theme palettes.
 */

import type { ColorPalette } from '../palettes/types'
import lightPalette from '../palettes/light'
import darkPalette from '../palettes/dark'
import { spacingWeb } from '../tokens'

/**
 * Flatten a nested color palette object into CSS custom property declarations.
 * Example: { text: { primary: '#000' } } => '--color-text-primary: #000;'
 */
function flattenPaletteToCSS(palette: ColorPalette, indent = '  '): string[] {
  const vars: string[] = []

  function flatten(obj: unknown, prefix = 'color'): void {
    if (typeof obj !== 'object' || obj === null) return

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        flatten(value, `${prefix}-${key}`)
      } else {
        // Add CSS custom property
        vars.push(`${indent}--${prefix}-${key}: ${value};`)
      }
    })
  }

  flatten(palette)
  return vars
}

/**
 * Generate spacing CSS custom properties.
 * Uses web spacing scale (8px base): space-1=8px, space-2=16px, etc.
 */
function generateSpacingCSS(indent = '  '): string[] {
  return Object.entries(spacingWeb).map(([key, value]) => {
    return `${indent}--space-${key}: ${value}px;`
  })
}

/**
 * Generate complete CSS variables file content.
 * Includes light mode (default), dark mode override, and media query fallback.
 */
export function generateCSSVars(): string {
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
