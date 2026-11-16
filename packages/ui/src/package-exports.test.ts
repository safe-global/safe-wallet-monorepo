import { existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'

const root = path.resolve(__dirname, '..')
const { exports: exportMap } = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, string>
}

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

  it('has no keys outside the two layers and the shared keys', () => {
    const canonical = new Set(LAYERS.flatMap((layer) => keysUnder(`./${layer}/`)))
    expect(Object.keys(exportMap).filter((key) => !canonical.has(key) && !SHARED_KEYS.includes(key))).toEqual([])
  })

  it('never gives a primitive and a Safe component the same name', () => {
    const primitives = new Set(componentFiles('primitives').map(({ name }) => name))
    expect(componentFiles('components').filter(({ name }) => primitives.has(name))).toEqual([])
  })

  it('resolves the hooks pattern', () => {
    for (const hook of ['use-mobile', 'use-tablet']) {
      expect(existsSync(path.join(root, exportMap['./hooks/*'].replaceAll('*', hook)))).toBe(true)
    }
  })
})
