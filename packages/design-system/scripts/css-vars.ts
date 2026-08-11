/**
 * Generates the brand CSS custom properties from @safe-global/theme, the cross-platform
 * source of the Safe palettes. The design system owns the generated file because its
 * semantic tokens (src/styles/tokens.css) are layered on top of these `--color-*` values.
 *
 * Run with: yarn workspace @safe-global/design-system css-vars
 */
import { generateCSSVars } from '../../theme/src/generators/css-vars'

const css = generateCSSVars()
console.log(css)
