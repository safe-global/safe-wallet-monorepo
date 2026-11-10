import { planSheets, shardStories, sheetHtml, type Cell } from '../sheets'

const MODES = ['light', 'dark']

const cell = (storyId: string, mode: string, fullscreen = false): Cell => ({
  storyId,
  name: storyId.split('--')[1],
  mode,
  file: `/tmp/cells/${storyId}--${mode}.png`,
  fullscreen,
})

const bothModes = (storyId: string, fullscreen = false): Cell[] => MODES.map((m) => cell(storyId, m, fullscreen))

describe('planSheets', () => {
  it('puts all stories of one title on one sheet, one row per story in index order', () => {
    const cells = [...bothModes('ui-button--secondary'), ...bothModes('ui-button--primary')]

    const sheets = planSheets(cells, ['ui-button--primary', 'ui-button--secondary'], MODES)

    expect(sheets).toHaveLength(1)
    expect(sheets[0].file).toBe('ui-button.png')
    expect(sheets[0].rows.map((r) => r.label)).toEqual(['primary', 'secondary'])
  })

  it('orders the cells of a row by mode, whatever order the sweep finished in', () => {
    const cells = [cell('ui-button--primary', 'dark'), cell('ui-button--primary', 'light')]

    const [sheet] = planSheets(cells, ['ui-button--primary'], MODES)

    expect(sheet.rows[0].cells.map((c) => c?.mode)).toEqual(['light', 'dark'])
  })

  it('gives each fullscreen story a sheet of its own', () => {
    const cells = [...bothModes('pages-home--default', true), ...bothModes('pages-home--empty', true)]

    const sheets = planSheets(cells, ['pages-home--default', 'pages-home--empty'], MODES)

    expect(sheets.map((s) => s.file)).toEqual(['pages-home--default.png', 'pages-home--empty.png'])
  })

  it('splits fullscreen stories off a title and keeps the rest on its sheet', () => {
    const cells = [...bothModes('spaces-list--page', true), ...bothModes('spaces-list--card')]

    const sheets = planSheets(cells, ['spaces-list--page', 'spaces-list--card'], MODES)

    expect(sheets.map((s) => s.file)).toEqual(['spaces-list--page.png', 'spaces-list.png'])
  })

  it('leaves out stories without screenshots, so a fully skipped title gets no sheet', () => {
    const sheets = planSheets(bothModes('ui-button--primary'), ['ui-skipped--a', 'ui-button--primary'], MODES)

    expect(sheets.map((s) => s.file)).toEqual(['ui-button.png'])
  })

  it('keeps an empty cell when one mode has no screenshot', () => {
    const [sheet] = planSheets([cell('ui-button--primary', 'light')], ['ui-button--primary'], MODES)

    expect(sheet.rows[0].cells).toEqual([expect.objectContaining({ mode: 'light' }), undefined])
  })

  it('returns no sheets when nothing was captured', () => {
    expect(planSheets([], ['ui-button--primary'], MODES)).toEqual([])
  })
})

describe('shardStories', () => {
  const stories = (title: string, count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `${title}--story-${i}` }))
  const all = [...stories('big', 6), ...stories('a', 2), ...stories('b', 2), ...stories('c', 3), ...stories('d', 1)]
  const titlesOf = (picked: Array<{ id: string }>) => [...new Set(picked.map((s) => s.id.split('--')[0]))]

  it('covers every story exactly once across all shards', () => {
    const picked = [1, 2, 3].flatMap((shard) => shardStories(all, shard, 3))

    expect(picked.map((s) => s.id).sort()).toEqual(all.map((s) => s.id).sort())
  })

  it('never splits a title across shards', () => {
    const shards = [1, 2, 3].map((shard) => titlesOf(shardStories(all, shard, 3)))

    expect(shards.flat()).toHaveLength(new Set(shards.flat()).size)
  })

  it('puts the next title on the shard with the fewest stories', () => {
    // big(6) -> 1, a(2) -> 2, b(2) -> 3, c(3) -> 2 (2 vs 2: first wins), d(1) -> 3
    expect([1, 2, 3].map((shard) => titlesOf(shardStories(all, shard, 3)))).toEqual([['big'], ['a', 'c'], ['b', 'd']])
  })

  it('returns everything for a single shard', () => {
    expect(shardStories(all, 1, 1)).toEqual(all)
  })

  it.each([
    [0, 4],
    [5, 4],
    [1, 0],
    [1.5, 4],
  ])('rejects shard %s of %s', (shard, total) => {
    expect(() => shardStories(all, shard, total)).toThrow(`Invalid shard ${shard}/${total}`)
  })
})

describe('sheetHtml', () => {
  it('renders one column per mode and links each cell image by file URL', () => {
    const [sheet] = planSheets(bothModes('ui-button--primary'), ['ui-button--primary'], MODES)

    const html = sheetHtml(sheet, MODES)

    expect(html).toContain('<th>light</th><th>dark</th>')
    expect(html).toContain('src="file:///tmp/cells/ui-button--primary--light.png"')
    expect(html).toContain('src="file:///tmp/cells/ui-button--primary--dark.png"')
  })

  it('marks a missing cell instead of dropping it, so the columns stay aligned', () => {
    const [sheet] = planSheets([cell('ui-button--primary', 'dark')], ['ui-button--primary'], MODES)

    expect(sheetHtml(sheet, MODES)).toContain('<td class="missing">no screenshot</td><td><img')
  })

  it('escapes story names', () => {
    const html = sheetHtml({ file: 'x.png', rows: [{ label: '<b>&"', cells: [] }] }, MODES)

    expect(html).toContain('<th>&lt;b&gt;&amp;&quot;</th>')
  })
})
