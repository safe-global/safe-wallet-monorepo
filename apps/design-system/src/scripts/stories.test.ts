import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { componentNames } from './paths.ts'
import { generateStories, toSlug, toTitle } from './stories.ts'

const { index, sources } = generateStories()

describe('stories', () => {
  it('indexes one story file per component export, with every story', () => {
    assert.deepEqual(index.map((entry) => entry.component).sort(), componentNames())
    assert.equal(
      index.reduce((total, entry) => total + entry.stories.length, 0),
      93,
    )
    for (const entry of index) assert.ok(entry.stories.length > 0, `${entry.component} has no story`)
  })

  it('prints the Code tab source with package imports', () => {
    const source = sources.button['all-variants']
    assert.match(source, /import \{ Button \} from '@safe-global\/ui\/button'/)
    assert.match(source, /<Button variant="secondary">/)
  })

  it('never leaves a relative import in a source', () => {
    for (const [component, stories] of Object.entries(sources)) {
      for (const [slug, code] of Object.entries(stories)) {
        assert.doesNotMatch(code, /from '\.\.?\//, `${component}/${slug}`)
      }
    }
  })

  it('substitutes args into render spreads and synthesises arg-only stories', () => {
    assert.match(sources['search-input'].default, /<SearchInput placeholder="Search" \/>/)
    assert.doesNotMatch(sources['search-input'].default, /\.\.\.args/)
  })

  it('names stories like Storybook', () => {
    assert.equal(toSlug('AllVariants'), 'all-variants')
    assert.equal(toSlug('WithIOSStyle'), 'with-ios-style')
    assert.equal(toTitle('AllVariants'), 'All Variants')
  })
})
