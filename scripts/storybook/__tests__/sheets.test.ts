import { planSheets, sheetHtml, type Cell } from '../sheets'

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
