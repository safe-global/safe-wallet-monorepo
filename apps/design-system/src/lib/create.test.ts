import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { componentNames } from '../scripts/paths.ts'
import { buildCreateOutput, PRESETS, type CreateOptions } from './create.ts'

const base: CreateOptions = {
  framework: 'vite',
  installPath: 'registry',
  components: ['dialog', 'button'],
  registryUrl: 'https://example.org/r/{name}.json',
  exportsByComponent: { button: ['Button'], dialog: ['Dialog', 'DialogContent'] },
}
const byId = (options: CreateOptions) =>
  Object.fromEntries(buildCreateOutput(options).map((block) => [block.id, block]))

describe('create', () => {
  it('lists the theme and the selected components for the registry path', () => {
    const blocks = byId(base)
    assert.equal(blocks.add.code, 'npx shadcn@latest add @safe/theme @safe/button @safe/dialog')
    const config = JSON.parse(blocks['components-json'].code)
    assert.equal(config.registries['@safe'], base.registryUrl)
    assert.equal(config.rsc, false)
    assert.equal(config.tailwind.css, 'src/index.css')
    assert.match(blocks['vite-config'].code, /alias/)
    assert.equal(blocks.css.code, "@import 'tailwindcss';")
    assert.match(blocks.css.title, /^src\/index\.css/)
    for (const id of ['tsconfig', 'tsconfig-app']) {
      assert.deepEqual(JSON.parse(blocks[id].code).compilerOptions.paths, { '@/*': ['./src/*'] })
    }
    assert.match(blocks.tsconfig.title, /^tsconfig\.json/)
    assert.match(blocks['tsconfig-app'].title, /^tsconfig\.app\.json/)
  })

  it('relies on create-next-app for the Next.js CSS and paths', () => {
    const blocks = byId({ ...base, framework: 'next' })
    assert.match(blocks.create.code, /--tailwind --app --src-dir/)
    assert.equal(blocks.css, undefined)
    assert.equal(blocks.tsconfig, undefined)
  })

  it('switches components.json to Next.js', () => {
    const config = JSON.parse(byId({ ...base, framework: 'next' })['components-json'].code)
    assert.equal(config.rsc, true)
    assert.equal(config.tailwind.css, 'src/app/globals.css')
  })

  it('prints the npm setup with styles, @source and imports', () => {
    const blocks = byId({ ...base, installPath: 'npm', framework: 'next' })
    assert.equal(blocks.install.code, 'npm install @safe-global/ui')
    assert.match(blocks.css.code, /@import '@safe-global\/ui\/styles\.css';/)
    assert.match(blocks.css.code, /@source '\.\.\/\.\.\/node_modules\/@safe-global\/ui\/src';/)
    assert.match(blocks['next-config'].code, /transpilePackages/)
    assert.equal(
      blocks.usage.code,
      "import { Button } from '@safe-global/ui/button'\nimport { Dialog, DialogContent } from '@safe-global/ui/dialog'",
    )
    assert.equal(blocks['components-json'], undefined)
  })

  it('keeps presets to known component names', () => {
    const known = new Set(componentNames())
    for (const names of Object.values(PRESETS)) for (const name of names) assert.ok(known.has(name), name)
  })
})
