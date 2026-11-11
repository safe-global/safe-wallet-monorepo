import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import type { ThemeMapping, TokenEntry, TokenGroup, TokensDoc } from '../lib/types.ts'
import { generatedDir, uiDir } from './paths.ts'

export const stylesDir = (root: string = uiDir): string => path.join(root, 'src/styles')

export const tokenGroup = (name: string): TokenGroup => {
  if (name.startsWith('--color-')) return 'palette'
  if (name.startsWith('--space-')) return 'spacing'
  if (name.startsWith('--radius')) return 'radius'
  if (name.startsWith('--z-')) return 'z-index'
  if (/^--[a-z]/.test(name)) return 'color'
  return 'other'
}

type Declarations = Array<[string, string]>

/** Custom-property declarations of each rule whose selector is in `selectors`, in source order */
export const readDeclarations = (css: string, selectors: string[]): Record<string, Declarations> => {
  const result: Record<string, Declarations> = Object.fromEntries(selectors.map((selector) => [selector, []]))
  postcss.parse(css).walkRules((rule) => {
    if (!selectors.includes(rule.selector)) return
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) result[rule.selector].push([decl.prop, decl.value])
    })
  })
  return result
}

export const readThemeInline = (css: string): ThemeMapping[] => {
  const mappings: ThemeMapping[] = []
  postcss.parse(css).walkAtRules('theme', (rule) => {
    rule.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) mappings.push({ name: decl.prop, value: decl.value })
    })
  })
  return mappings
}

const utilityFor = (theme: ThemeMapping[]) => {
  const byVariable = new Map<string, string>()
  for (const { name, value } of theme) {
    const match = value.match(/^var\((--[\w-]+)\)$/)
    if (!match || byVariable.has(match[1])) continue
    if (name.startsWith('--color-')) byVariable.set(match[1], `bg-${name.slice('--color-'.length)}`)
  }
  return (name: string) => byVariable.get(name)
}

export const generateTokens = (root: string = uiDir): TokensDoc => {
  const tokensCss = readFileSync(path.join(stylesDir(root), 'tokens.css'), 'utf8')
  const themeCss = readFileSync(path.join(stylesDir(root), 'tailwind-theme.css'), 'utf8')
  const { ':root': light, '.dark': dark } = readDeclarations(tokensCss, [':root', '.dark'])
  const darkValues = new Map(dark)
  const theme = readThemeInline(themeCss)
  const utility = utilityFor(theme)
  const lightNames = new Set(light.map(([name]) => name))
  const darkOnly: TokenEntry[] = dark
    .filter(([name]) => !lightNames.has(name))
    .map(([name, value]) => ({
      name,
      dark: value,
      group: tokenGroup(name),
      ...(utility(name) ? { tailwind: utility(name) } : {}),
    }))
  const tokens: TokenEntry[] = light.map(([name, value]) => {
    const darkValue = darkValues.get(name)
    const tailwind = utility(name)
    return {
      name,
      light: value,
      ...(darkValue !== undefined && darkValue !== value ? { dark: darkValue } : {}),
      group: tokenGroup(name),
      ...(tailwind ? { tailwind } : {}),
    }
  })
  tokens.push(...darkOnly)
  const fontSans = theme.find((mapping) => mapping.name === '--font-sans')?.value ?? ''
  return { tokens, theme, fontSans }
}

export const main = (): void => {
  const doc = generateTokens()
  mkdirSync(generatedDir, { recursive: true })
  writeFileSync(path.join(generatedDir, 'tokens.json'), `${JSON.stringify(doc, null, 2)}\n`)
  console.log(`tokens: ${doc.tokens.length} variables, ${doc.theme.length} theme mappings`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
