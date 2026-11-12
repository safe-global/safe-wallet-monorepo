import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { componentNames, contentDir } from './paths.ts'
import { componentsContentDir, SECTIONS } from './scaffold-pages.ts'
import { generateStories } from './stories.ts'

const pages = readdirSync(componentsContentDir)
  .filter((file) => file.endsWith('.mdx') && file !== 'index.mdx')
  .map((file) => {
    const text = readFileSync(path.join(componentsContentDir, file), 'utf8')
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    const field = (name: string) => frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1].trim()
    return { file, text, component: field('component'), description: field('description') }
  })
const names = componentNames()
const { index } = generateStories()

describe('component pages', () => {
  it('has a page for every component export', () => {
    const covered = new Set(pages.map((page) => page.component))
    const missing = names.filter((name) => !covered.has(name))
    assert.deepEqual(missing, [], `no page for: ${missing.join(', ')} (run yarn scaffold:pages)`)
  })

  it('names only components that exist', () => {
    for (const page of pages)
      assert.ok(page.component && names.includes(page.component), `${page.file}: ${page.component}`)
  })

  it('has a story file with at least one story for every component', () => {
    for (const name of names) {
      const entry = index.find((item) => item.component === name)
      assert.ok(entry && entry.stories.length > 0, `${name} has no story`)
    }
  })

  it('keeps the seven sections in order', () => {
    for (const page of pages) {
      const positions = [
        page.text.indexOf(`<ComponentPreview component="${page.component}"`),
        ...SECTIONS.map((section) => page.text.indexOf(`\n## ${section}\n`)),
      ]
      assert.ok(
        positions.every((position, i) => position > -1 && (i === 0 || position > positions[i - 1])),
        `${page.file}: sections missing or out of order`,
      )
      for (const tag of ['ComponentInstall', 'ComponentExamples', 'ComponentProps', 'ComponentRules']) {
        assert.ok(page.text.includes(`<${tag} component="${page.component}"`), `${page.file}: no <${tag}>`)
      }
    }
  })

  it('keeps every docs page under docs/ or components/', () => {
    const top = readdirSync(contentDir).filter((entry) => entry !== 'meta.json')
    assert.deepEqual(top.sort(), ['components', 'docs'])
    assert.ok(readdirSync(componentsContentDir).includes('index.mdx'), 'components/index.mdx is the components index')
  })

  it('has no placeholder text left', () => {
    for (const page of pages) assert.doesNotMatch(page.text, /\bTODO\b/, page.file)
  })
})
