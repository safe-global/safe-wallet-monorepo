import { parseOptions, selectStories, type StoryEntry } from '../sweep-options'

describe('parseOptions', () => {
  it('uses the defaults without arguments', () => {
    expect(parseOptions([], {})).toEqual({
      base: 'http://localhost:6006',
      modes: ['light', 'dark'],
      concurrency: 8,
      filters: [],
      shard: 1,
      shardCount: 1,
      shotsDir: undefined,
      manifestFile: undefined,
      jsonFile: undefined,
    })
  })

  it('reads every flag', () => {
    const options = parseOptions(
      [
        '--base=http://localhost:4000',
        '--modes=light',
        '--concurrency=6',
        '--filter=ui-,pages-',
        '--shard=2/4',
        '--shots=out',
        '--manifest=m.json',
        '--json=f.json',
      ],
      {},
    )
    expect(options).toEqual({
      base: 'http://localhost:4000',
      modes: ['light'],
      concurrency: 6,
      filters: ['ui-', 'pages-'],
      shard: 2,
      shardCount: 4,
      shotsDir: 'out',
      manifestFile: 'm.json',
      jsonFile: 'f.json',
    })
  })

  it('takes the Storybook from SB_BASE when --base is missing, and prefers --base', () => {
    expect(parseOptions([], { SB_BASE: 'http://ci:4000' }).base).toBe('http://ci:4000')
    expect(parseOptions(['--base=http://localhost:4000'], { SB_BASE: 'http://ci:4000' }).base).toBe(
      'http://localhost:4000',
    )
  })

  it('falls back to the default concurrency for a value that is not a number', () => {
    expect(parseOptions(['--concurrency=many'], {}).concurrency).toBe(8)
  })

  it('drops empty entries from the filter list', () => {
    expect(parseOptions(['--filter=ui-,,pages-,'], {}).filters).toEqual(['ui-', 'pages-'])
  })

  it('ignores a flag without a value', () => {
    expect(parseOptions(['--shots'], {}).shotsDir).toBeUndefined()
  })
})

describe('selectStories', () => {
  const entry = (id: string, title: string, type = 'story'): StoryEntry => ({ id, title, name: id, type })
  const entries = [
    entry('ui-button--primary', 'UI/Button'),
    entry('pages-home--default', 'Pages/Home'),
    entry('ui-button--docs', 'UI/Button', 'docs'),
  ]

  it('keeps every story, and no docs, without filters', () => {
    expect(selectStories(entries, []).map((story) => story.id)).toEqual(['ui-button--primary', 'pages-home--default'])
  })

  it('keeps a story whose id or title contains any filter', () => {
    expect(selectStories(entries, ['pages-']).map((story) => story.id)).toEqual(['pages-home--default'])
    expect(selectStories(entries, ['UI/']).map((story) => story.id)).toEqual(['ui-button--primary'])
    expect(selectStories(entries, ['nothing', 'Home']).map((story) => story.id)).toEqual(['pages-home--default'])
  })

  it('returns nothing when no story matches', () => {
    expect(selectStories(entries, ['nothing'])).toEqual([])
  })
})
