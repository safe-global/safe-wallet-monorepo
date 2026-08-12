import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Guards the legibility of the semantic tint surfaces (Alert, Badge, Chip `warning`/`info`/`success`)
 * by computing the real WCAG contrast ratio from the token values, rather than asserting that a
 * particular utility class is present.
 *
 * The migration aliased `--color-*-strong` onto `--color-*-dark` and used it as body text on a
 * `--color-*-background` tint. Those `*-dark` tokens hold the SAME value in both themes — they are
 * accents, not inks — so as text they measured 2.04:1 (info, light), 3.14:1 (warning, dark) and
 * ~3.7:1 (success, both). A class-name assertion could not see any of that; this can.
 */

const STYLES = join(__dirname)

const readBlock = (file: string, selector: string): string => {
  const css = readFileSync(join(STYLES, file), 'utf8')
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector ${selector} not found in ${file}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('\n}', open)
  return css.slice(open, close)
}

const readVar = (block: string, name: string): string => {
  const m = block.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`${name} not found (or not a 6-digit hex) in the given block`)
  return m[1]
}

const relativeLuminance = (hex: string): number => {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

const AA_TEXT = 4.5

const THEMES = [
  { name: 'light', vars: ':root', shadcn: '.shadcn-scope' },
  { name: 'dark', vars: "[data-theme='dark']", shadcn: '.dark.shadcn-scope' },
] as const

const TINTS = ['warning', 'info', 'success'] as const

describe('semantic tint contrast', () => {
  THEMES.forEach(({ name, vars, shadcn }) => {
    const varsBlock = readBlock('vars.css', vars)
    const foreground = readVar(readBlock('shadcn.css', shadcn), '--foreground')

    TINTS.forEach((tint) => {
      it(`${name}: default foreground on --color-${tint}-background clears AA`, () => {
        const background = readVar(varsBlock, `--color-${tint}-background`)
        const ratio = contrastRatio(foreground, background)

        expect(ratio).toBeGreaterThanOrEqual(AA_TEXT)
      })
    })
  })

  it('records why *-dark must not be used as body text on its own tint', () => {
    // The exact pairing that shipped. Kept as an assertion so that if someone "fixes" these tokens
    // to be usable as ink, this test fails and points them at the variants that could then use them.
    const light = readBlock('vars.css', ':root')
    const dark = readBlock('vars.css', "[data-theme='dark']")

    expect(contrastRatio(readVar(light, '--color-info-dark'), readVar(light, '--color-info-background'))).toBeLessThan(
      AA_TEXT,
    )
    expect(
      contrastRatio(readVar(dark, '--color-warning-dark'), readVar(dark, '--color-warning-background')),
    ).toBeLessThan(AA_TEXT)
  })
})
