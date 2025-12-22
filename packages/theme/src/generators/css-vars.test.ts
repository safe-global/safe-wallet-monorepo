import { generateCSSVars } from './css-vars'

describe('generateCSSVars', () => {
  let cssOutput: string

  beforeAll(() => {
    cssOutput = generateCSSVars()
  })

  it('should include file header comment', () => {
    expect(cssOutput).toContain('This file is generated from @safe-global/theme')
  })

  it('should include :root selector with light mode colors', () => {
    expect(cssOutput).toContain(':root {')
    expect(cssOutput).toContain('--color-text-primary:')
    expect(cssOutput).toContain('--color-primary-main:')
    expect(cssOutput).toContain('--color-background-paper:')
  })

  it('should include dark mode selector', () => {
    expect(cssOutput).toContain('[data-theme="dark"] {')
  })

  it('should include media query for prefers-color-scheme', () => {
    expect(cssOutput).toContain('@media (prefers-color-scheme: dark)')
    expect(cssOutput).toContain(":root:not([data-theme='light'])")
  })

  it('should include spacing variables', () => {
    expect(cssOutput).toContain('--space-1:')
    expect(cssOutput).toContain('--space-2:')
    expect(cssOutput).toContain('8px')
    expect(cssOutput).toContain('16px')
  })

  it('should have different values for light and dark modes', () => {
    // Light mode text-primary should be dark color
    expect(cssOutput).toMatch(/:root \{[\s\S]*--color-text-primary: #121312/)
    // Dark mode text-primary should be light color
    expect(cssOutput).toMatch(/\[data-theme="dark"\] \{[\s\S]*--color-text-primary: #ffffff/i)
  })

  it('should convert camelCase palette keys to kebab-case CSS variables', () => {
    // Static colors with camelCase keys should be converted
    expect(cssOutput).toContain('--color-static-text-secondary:')
    expect(cssOutput).toContain('--color-static-text-brand:')
    expect(cssOutput).not.toContain('--color-static-textSecondary')
    expect(cssOutput).not.toContain('--color-static-textBrand')

    // contrastText should become contrast-text
    expect(cssOutput).toContain('--color-error1-contrast-text:')
    expect(cssOutput).not.toContain('--color-error1-contrastText')
  })
})
