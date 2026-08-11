import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SEMANTIC_GROUPS, RADIUS_TOKENS, Z_TOKENS } from '../stories/foundations/tokens'

/**
 * The token contract: every token the Foundations gallery advertises must actually exist, in both
 * themes, and resolve to something.
 *
 * This is the guard that makes the design system safe for designers to edit. The failure it exists
 * to catch is silent: a renamed or deleted custom property leaves `var(--color-thing)` resolving to
 * nothing, and the component renders transparent or unstyled — no error, no failing render test,
 * just a surface that quietly lost its colour. Nothing else in the pipeline notices, because
 * neither TypeScript nor the CSS parser knows a custom property is missing.
 *
 * It also pins the two invariants that are not obvious from reading the file:
 *   - dark mode redefines every token light mode defines (a token defined only in light silently
 *     keeps its light value on a dark surface),
 *   - the overlay z-index ladder stays strictly ordered.
 */

const STYLES = __dirname
const TOKENS_CSS = readFileSync(join(STYLES, 'tokens.css'), 'utf8')
const BRAND_VARS_CSS = readFileSync(join(STYLES, 'brand-vars.css'), 'utf8')

/** Extracts the declaration block for a selector (up to the first line-starting `}`). */
const readBlock = (css: string, selector: string, label: string): string => {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector ${selector} not found in ${label}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('\n}', open)
  return css.slice(open, close)
}

/** All `--custom-property: value` declarations in a block. */
const declarationsIn = (block: string): Map<string, string> => {
  const found = new Map<string, string>()
  for (const [, name, value] of block.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    found.set(name, value.trim())
  }
  return found
}

const LIGHT_SCOPE = declarationsIn(readBlock(TOKENS_CSS, '.shadcn-scope {', 'tokens.css'))
const DARK_SCOPE = declarationsIn(readBlock(TOKENS_CSS, '.dark.shadcn-scope,', 'tokens.css'))
const THEME_MAP = declarationsIn(readBlock(TOKENS_CSS, '@theme inline {', 'tokens.css'))
const BRAND_LIGHT = declarationsIn(readBlock(BRAND_VARS_CSS, ':root {', 'brand-vars.css'))
const BRAND_DARK = declarationsIn(readBlock(BRAND_VARS_CSS, "[data-theme='dark']", 'brand-vars.css'))

/** Resolves a `--color-*` Tailwind token to the chain of raw values it can bottom out in. */
const resolvesInTheme = (token: string, scope: Map<string, string>, brand: Map<string, string>): boolean => {
  const seen = new Set<string>()
  const pending = [token]

  while (pending.length > 0) {
    const name = pending.pop() as string
    if (seen.has(name)) continue
    seen.add(name)

    const value = THEME_MAP.get(name) ?? scope.get(name) ?? brand.get(name)
    if (value === undefined) return false

    const references = [...value.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map(([, ref]) => ref)
    // A literal (hex, oklch, rgba, a number) terminates the chain successfully.
    if (references.length === 0) continue
    pending.push(...references)
  }

  return true
}

const SEMANTIC_TOKENS = SEMANTIC_GROUPS.flatMap((group) => group.tokens.map((token) => token.name))

describe('design token contract', () => {
  it('advertises a non-empty inventory', () => {
    // Guards against the gallery data being emptied or restructured into nothing.
    expect(SEMANTIC_TOKENS.length).toBeGreaterThan(30)
  })

  describe.each([
    ['light', LIGHT_SCOPE, BRAND_LIGHT],
    ['dark', DARK_SCOPE, BRAND_DARK],
  ])('%s theme', (_theme, scope, brand) => {
    it.each(SEMANTIC_TOKENS)('%s resolves to a value', (token) => {
      expect(resolvesInTheme(token, scope as Map<string, string>, brand as Map<string, string>)).toBe(true)
    })
  })

  it('redefines every themeable scoped token in dark mode', () => {
    // A colour defined only in `.shadcn-scope` keeps its light value on a dark surface — the bug
    // this catches. Two categories are legitimately theme-independent and excluded:
    //   - geometry (`--radius*`) and the overlay ladder (`--z-*`): a corner or a stacking order
    //     does not change with the theme,
    //   - tokens whose value is itself a `var()` pointing at a brand var that dark mode redefines.
    const isGeometry = (name: string) => name.startsWith('--radius') || name.startsWith('--z-')

    const themeable = [...LIGHT_SCOPE.entries()]
      .filter(([name, value]) => !isGeometry(name) && !value.includes('var('))
      .map(([name]) => name)

    const missing = themeable.filter((name) => !DARK_SCOPE.has(name))

    expect(missing).toEqual([])
  })

  it('keeps the overlay stacking order strictly increasing', () => {
    const values = Z_TOKENS.map(({ name }) => {
      const raw = LIGHT_SCOPE.get(name)
      if (raw === undefined) throw new Error(`${name} is not defined in .shadcn-scope`)
      return Number(raw)
    })

    expect(values.every((value) => Number.isFinite(value))).toBe(true)
    expect([...values]).toEqual([...values].sort((a, b) => a - b))
  })

  it('defines every radius token the gallery shows', () => {
    const missing = RADIUS_TOKENS.filter(({ name }) => !THEME_MAP.has(name)).map(({ name }) => name)

    expect(missing).toEqual([])
  })
})
