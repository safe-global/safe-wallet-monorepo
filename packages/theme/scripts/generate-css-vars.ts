/**
 * Build script to generate CSS variables file.
 * This script is called during the web app's build process.
 */

import { generateCSSVars } from '../src/generators/css-vars'

// Generate and output CSS variables
const css = generateCSSVars()
console.log(css)
