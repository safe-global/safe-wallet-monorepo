import { readdirSync, readFileSync } from 'fs'
import path from 'path'

const stylesDir = __dirname
const read = (file: string): string => readFileSync(path.join(stylesDir, file), 'utf8')
const pkg = JSON.parse(readFileSync(path.join(stylesDir, '../../package.json'), 'utf8')) as {
  dependencies: Record<string, string>
  peerDependencies: Record<string, string>
}

const ruleBody = (css: string, selector: string): string => {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No rule for ${selector}`)
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start))
}

const declarations = (body: string): Map<string, string> =>
  new Map(Array.from(body.matchAll(/(--[\w-]+):\s*([^;]+);/g), ([, name, value]) => [name, value.trim()]))

const varReferences = (source: string): string[] => Array.from(source.matchAll(/var\((--[\w-]+)/g), ([, name]) => name)

const filesIn = (dir: string, pattern: RegExp): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return filesIn(file, pattern)
    return pattern.test(entry.name) ? [file] : []
  })

const cssFiles = readdirSync(stylesDir).filter((file) => file.endsWith('.css'))
const importsOf = (file: string): string[] =>
  Array.from(read(file).matchAll(/@import\s+['"]([^'"]+)['"]/g), ([, specifier]) => specifier)

const tokens = read('tokens.css')
const scopedTokens = read('tokens.scoped.css')
const themeCss = read('tailwind-theme.css')

describe('scoped preflight', () => {
  it('hides [hidden] elements inside .shadcn-scope despite its display resets', () => {
    const css = read('scoped.css')
    const selector = ".shadcn-scope [hidden]:where(:not([hidden='until-found']))"
    const start = css.indexOf(selector)
    expect(start).toBeGreaterThan(-1)

    const body = css.slice(css.indexOf('{', start), css.indexOf('}', start))
    expect(body).toMatch(/display:\s*none\s*!important/)
  })
})

describe('tokens.css', () => {
  it.each([
    ['light', '.shadcn-scope', ':root'],
    ['dark', '.dark.shadcn-scope,\n.shadcn-scope.dark', '.dark'],
  ])('repeats every %s scoped token with the same value', (_, scopedSelector, selector) => {
    const scoped = declarations(ruleBody(scopedTokens, scopedSelector))
    const unscoped = declarations(ruleBody(tokens, selector))

    expect(scoped.size).toBeGreaterThan(40)
    scoped.forEach((value, name) => expect([name, unscoped.get(name)]).toEqual([name, value]))
  })

  it('declares every variable that tailwind-theme.css, the tokens and the components read', () => {
    const declared = new Set([
      ...declarations(tokens).keys(),
      ...declarations(ruleBody(themeCss, '@theme inline')).keys(),
    ])
    const componentSources = filesIn(path.join(stylesDir, '../components'), /\.tsx?$/).map((file) =>
      readFileSync(file, 'utf8'),
    )
    const references = [
      ...varReferences(themeCss),
      ...varReferences(tokens),
      ...componentSources.flatMap(varReferences).filter((name) => name.startsWith('--color-')),
    ]

    expect(references.length).toBeGreaterThan(50)
    expect([...new Set(references)].filter((name) => !declared.has(name))).toEqual([])
  })
})

describe('style imports', () => {
  const imports = cssFiles.flatMap((file) => importsOf(file).map((specifier) => ({ file, specifier })))

  it('import bare packages only from dependencies or peerDependencies', () => {
    const declaredPackages = new Set([...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)])
    const bare = imports.filter(({ specifier }) => !specifier.startsWith('.'))

    expect(bare.length).toBeGreaterThan(0)
    bare.forEach(({ specifier }) => {
      const name = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
      expect([specifier, declaredPackages.has(name)]).toEqual([specifier, true])
    })
  })

  it('keep relative imports inside src/styles', () => {
    imports
      .filter(({ specifier }) => specifier.startsWith('.'))
      .forEach(({ file, specifier }) => {
        expect(path.dirname(path.resolve(stylesDir, path.dirname(file), specifier))).toBe(stylesDir)
      })
  })

  it.each(['styles.css', 'scoped.css'])('%s leaves the tailwindcss import to the app', (file) => {
    expect(importsOf(file).filter((specifier) => specifier.startsWith('tailwindcss'))).toEqual([])
  })
})
