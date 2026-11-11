import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { componentNames, INTERNAL_REFERENCE } from './paths.ts'
import { buildRegistry, generateRegistry, registryJsonPath, serialiseRegistry } from './registry.ts'
import { readDeclarations, stylesDir } from './tokens.ts'

const registry = generateRegistry()

describe('registry', () => {
  it('matches the committed registry.json', () => {
    assert.equal(
      serialiseRegistry(registry) === readFileSync(registryJsonPath, 'utf8') ? 'current' : 'stale',
      'current',
      'registry.json is stale: run `yarn workspace @safe-global/design-system registry:build` and commit the result',
    )
  })

  it('has a registry:ui item for every component export, plus the shared items', () => {
    const byName = new Map(registry.items.map((item) => [item.name, item]))
    for (const name of componentNames()) assert.equal(byName.get(name)?.type, 'registry:ui', name)
    assert.equal(byName.get('provider')?.type, 'registry:ui')
    assert.equal(byName.get('utils')?.type, 'registry:lib')
    assert.equal(byName.get('use-mobile')?.type, 'registry:hook')
    assert.equal(byName.get('use-tablet')?.type, 'registry:hook')
    assert.equal(byName.get('theme')?.type, 'registry:theme')
    assert.equal(registry.items.length, componentNames().length + 5)
  })

  it('puts exactly the tokens.css declarations in the theme cssVars', () => {
    const theme = registry.items.find((item) => item.name === 'theme')!
    const css = readFileSync(path.join(stylesDir(), 'tokens.css'), 'utf8')
    const { ':root': light, '.dark': dark } = readDeclarations(css, [':root', '.dark'])
    const strip = (entries: Array<[string, string]>) => Object.fromEntries(entries.map(([n, v]) => [n.slice(2), v]))
    assert.deepEqual(theme.cssVars?.light, strip(light))
    assert.deepEqual(theme.cssVars?.dark, strip(dark))
    assert.equal(theme.cssVars?.theme['color-primary'], 'var(--primary)')
  })

  it('rewrites every relative import and names registry dependencies by namespace', () => {
    const { outputs } = buildRegistry()
    for (const [file, content] of Object.entries(outputs)) {
      assert.doesNotMatch(content, /from\s+['"]\.\.\//, file)
    }
    const names = new Set(registry.items.map((item) => item.name))
    for (const item of registry.items) {
      for (const dependency of item.registryDependencies ?? []) {
        assert.match(dependency, /^@safe\//)
        assert.ok(names.has(dependency.slice('@safe/'.length)), `${item.name} → ${dependency}`)
      }
      for (const dependency of item.dependencies ?? []) assert.match(dependency, /^(@[\w-]+\/)?[\w.-]+@\^?[\d.]+/)
    }
  })

  it('ships no repo-internal references to consumers', () => {
    for (const [file, content] of Object.entries(buildRegistry().outputs)) {
      assert.doesNotMatch(content, INTERNAL_REFERENCE, file)
    }
  })

  it('ships table.module.css next to table.tsx', () => {
    const table = registry.items.find((item) => item.name === 'table')!
    assert.ok(table.files?.some((file) => file.path.endsWith('table.module.css') && file.type === 'registry:file'))
  })
})
