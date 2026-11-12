import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const { exports: exportMap } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, string>
}

/** Deprecated flat keys (`@safe-global/ui/button`), frozen until Phase 2 removes them; never add to this list */
const LEGACY_FLAT_KEYS = [
  'accordion',
  'alert-dialog',
  'alert',
  'aspect-ratio',
  'avatar',
  'badge',
  'breadcrumb',
  'button',
  'calendar',
  'card',
  'checkbox',
  'chip',
  'collapsible',
  'combobox',
  'context-menu',
  'dialog',
  'drawer',
  'dropdown-menu',
  'empty',
  'field',
  'hover-card',
  'input-group',
  'input-otp',
  'input',
  'kbd',
  'label',
  'link',
  'list',
  'navigation-menu',
  'overlay',
  'pagination',
  'popover',
  'progress',
  'radio-group',
  'resizable',
  'scroll-area',
  'search-input',
  'select',
  'separator',
  'sheet',
  'sidebar',
  'skeleton',
  'slider',
  'sonner',
  'spinner',
  'switch',
  'table',
  'tabs',
  'textarea',
  'toggle',
  'tooltip',
  'typography',
]

const SHARED_KEYS = [
  './utils',
  './hooks/*',
  './provider',
  './styles.css',
  './scoped.css',
  './tokens.css',
  './eslint',
  './package.json',
]

const LAYERS = ['primitives', 'components'] as const

/** `<layer>/<name>/<name>.ts(x)` for every component folder of a layer */
const componentFiles = (layer: (typeof LAYERS)[number]): Array<{ name: string; file: string }> => {
  const dir = path.join(root, 'src', layer)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => {
      const file = ['tsx', 'ts'].map((ext) => `${name}.${ext}`).find((f) => existsSync(path.join(dir, name, f)))
      return { name, file: `./src/${layer}/${name}/${file ?? `${name}.tsx`}` }
    })
}

const keysUnder = (prefix: string): string[] => Object.keys(exportMap).filter((key) => key.startsWith(prefix))

describe('package exports', () => {
  describe.each(LAYERS)('%s', (layer) => {
    const files = componentFiles(layer)

    it('exposes every component folder under its canonical key', () => {
      for (const { name, file } of files) expect([name, exportMap[`./${layer}/${name}`]]).toEqual([name, file])
    })

    it('has a component folder behind every key', () => {
      const names = new Set(files.map(({ name }) => name))
      expect(keysUnder(`./${layer}/`).filter((key) => !names.has(key.slice(`./${layer}/`.length)))).toEqual([])
    })
  })

  it.each(Object.entries(exportMap).filter(([key]) => !key.includes('*')))(
    '%s points at an existing file',
    (_, target) => {
      expect(existsSync(path.join(root, target))).toBe(true)
    },
  )

  it('keeps the deprecated flat keys frozen, each an alias of its primitive', () => {
    const canonical = new Set(['primitives', 'components'].flatMap((layer) => keysUnder(`./${layer}/`)))
    const flat = Object.keys(exportMap).filter((key) => !canonical.has(key) && !SHARED_KEYS.includes(key))
    expect(flat.map((key) => key.slice(2)).sort()).toEqual([...LEGACY_FLAT_KEYS].sort())
    for (const name of LEGACY_FLAT_KEYS) expect(exportMap[`./${name}`]).toBe(exportMap[`./primitives/${name}`])
  })

  it('never gives a primitive and a Safe component the same name', () => {
    const primitives = new Set(componentFiles('primitives').map(({ name }) => name))
    expect(componentFiles('components').filter(({ name }) => primitives.has(name))).toEqual([])
  })

  it('resolves the hooks pattern', () => {
    for (const hook of ['use-mobile', 'use-tablet']) {
      expect(existsSync(path.join(root, exportMap['./hooks/*'].replace('*', hook)))).toBe(true)
    }
  })
})
