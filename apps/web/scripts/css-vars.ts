/**
 * Script to generate CSS variables file from the unified theme package.
 * Run with: yarn css-vars
 */
import { generateCSSVars } from '../../../packages/theme/src/generators/css-vars'

const css = generateCSSVars()
console.log(css)
