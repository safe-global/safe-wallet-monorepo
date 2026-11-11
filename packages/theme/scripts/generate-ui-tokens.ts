/**
 * Writes packages/ui/src/styles/tokens.css and tokens.scoped.css from the theme.
 * Run with: yarn workspace @safe-global/theme generate:ui-tokens
 */

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { generateUiScopedTokensCSS, generateUiTokensCSS } from '../src/generators/ui-css'

const stylesDir = fileURLToPath(new URL('../../ui/src/styles/', import.meta.url))

writeFileSync(`${stylesDir}tokens.css`, generateUiTokensCSS())
writeFileSync(`${stylesDir}tokens.scoped.css`, generateUiScopedTokensCSS())
console.log(`Wrote tokens.css and tokens.scoped.css to ${stylesDir}`)
