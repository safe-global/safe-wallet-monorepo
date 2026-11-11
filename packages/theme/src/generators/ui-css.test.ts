import { generateWebVarDeclarations, webDarkPalette } from './css-vars'
import { generateUiScopedTokensCSS, generateUiTokensCSS } from './ui-css'
import { uiTokens } from '../tokens/ui'

const ruleBody = (css: string, selector: string): string => {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No rule for ${selector}`)
  return css.slice(start + selector.length + 2, css.indexOf('\n}', start))
}

const declarations = (body: string): string[] =>
  body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const expected = (tokens: Readonly<Record<string, string>>): string[] =>
  Object.entries(tokens).map(([name, value]) => `--${name}: ${value.toLowerCase()};`)

describe('generateUiScopedTokensCSS', () => {
  const css = generateUiScopedTokensCSS()

  it('declares the light tokens on .shadcn-scope in order', () => {
    expect(declarations(ruleBody(css, '.shadcn-scope'))).toEqual(expected(uiTokens.light))
  })

  it('declares the dark tokens on both dark selectors in order', () => {
    expect(declarations(ruleBody(css, '.dark.shadcn-scope,\n.shadcn-scope.dark'))).toEqual(expected(uiTokens.dark))
  })

  it('declares no palette variables', () => {
    expect(css).not.toContain('--color-text-primary:')
  })
})

describe('generateUiTokensCSS', () => {
  const css = generateUiTokensCSS()
  const web = generateWebVarDeclarations()
  const lower = (lines: string[]) => lines.map((line) => line.toLowerCase())

  it('puts the web light palette and spacing, then the light tokens, on :root', () => {
    expect(declarations(ruleBody(css, ':root'))).toEqual([...lower(web.light), ...expected(uiTokens.light)])
  })

  it('puts the web dark palette, then the dark tokens, on .dark', () => {
    expect(declarations(ruleBody(css, '.dark'))).toEqual([...lower(web.dark), ...expected(uiTokens.dark)])
  })
})

describe.each([
  ['tokens.css', generateUiTokensCSS()],
  ['tokens.scoped.css', generateUiScopedTokensCSS()],
])('%s output', (_, css) => {
  it('has no uppercase hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]*[A-F][0-9a-fA-F]*\b/)
  })

  it('starts with the generated header and no .shadcn-scope text before the first rule', () => {
    expect(css.startsWith('/* Generated from @safe-global/theme')).toBe(true)
    const header = css.slice(0, css.indexOf('\n\n'))
    expect(header).toContain('generate:ui-tokens')
    expect(header).not.toContain('.shadcn-scope')
  })

  it('ends with a single newline', () => {
    expect(css.endsWith('}\n')).toBe(true)
  })
})

describe('dark tokens taken from the palette', () => {
  it.each([
    ['destructive', () => webDarkPalette.error.main],
    ['accent-success', () => webDarkPalette.success.main],
  ])('--%s follows the web dark palette', (name, read) => {
    expect(uiTokens.dark[name]).toBe(read().toLowerCase())
    expect(generateUiScopedTokensCSS()).toContain(`--${name}: ${read().toLowerCase()};`)
  })
})
