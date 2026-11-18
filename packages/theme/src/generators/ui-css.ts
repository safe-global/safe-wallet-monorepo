/**
 * CSS generators for @safe-global/ui: tokens.css (unscoped, self-contained) and tokens.scoped.css (wallet).
 * Output is already in Prettier's format, so the committed files can be compared as exact strings.
 */

import { uiTokens } from '../tokens/ui'
import { generateWebVarDeclarations } from './css-vars'

const UI_TOKENS_HEADER =
  '/* Generated from @safe-global/theme (yarn workspace @safe-global/theme generate:ui-tokens). Do not edit. */'

const lowercaseHex = (value: string): string => value.replace(/#[0-9A-Fa-f]+/g, (hex) => hex.toLowerCase())

const tokenDeclarations = (tokens: Readonly<Record<string, string>>): string[] =>
  Object.entries(tokens).map(([name, value]) => `--${name}: ${value};`)

function cssFile(rules: Array<[selector: string, declarations: string[]]>): string {
  const body = rules
    .map(
      ([selector, declarations]) => `${selector} {\n${declarations.map((d) => `  ${lowercaseHex(d)}`).join('\n')}\n}`,
    )
    .join('\n\n')
  return `${UI_TOKENS_HEADER}\n\n${body}\n`
}

/** Shadcn-named variables only, on `.shadcn-scope`; the host provides the palette `--color-*` variables */
export function generateUiScopedTokensCSS(): string {
  return cssFile([
    ['.shadcn-scope', tokenDeclarations(uiTokens.light)],
    ['.dark.shadcn-scope,\n.shadcn-scope.dark', tokenDeclarations(uiTokens.dark)],
  ])
}

/** Web palette, spacing and shadcn-named variables on `:root` / `.dark` */
export function generateUiTokensCSS(): string {
  const web = generateWebVarDeclarations()
  return cssFile([
    [':root', [...web.light, ...tokenDeclarations(uiTokens.light)]],
    ['.dark', [...web.dark, ...tokenDeclarations(uiTokens.dark)]],
  ])
}
