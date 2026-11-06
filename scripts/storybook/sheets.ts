import { pathToFileURL } from 'url'

/** One screenshot of one story in one mode. */
export interface Cell {
  storyId: string
  name: string
  mode: string
  file: string
  fullscreen: boolean
}

export interface SheetRow {
  label: string
  cells: Array<Cell | undefined>
}

export interface Sheet {
  file: string
  rows: SheetRow[]
}

/**
 * Groups screenshots into one image per component and one image per page story.
 *
 * Padded and centered stories that share a title go on one sheet, one row per story.
 * Fullscreen (page) stories get a sheet of their own, as they are too large to stack.
 * Each row holds one cell per mode, in the order of `modes`.
 *
 * Args:
 *   cells: The screenshots taken by the sweep, in any order.
 *   storyOrder: Story ids in index order; this fixes the row order so sheets are stable.
 *   modes: The swept modes; this fixes the column order.
 *
 * Returns:
 *   The sheets in story order. Stories without any screenshot are left out.
 */
export function planSheets(cells: Cell[], storyOrder: string[], modes: string[]): Sheet[] {
  const byStory = new Map<string, Cell[]>()
  for (const cell of cells) byStory.set(cell.storyId, [...(byStory.get(cell.storyId) ?? []), cell])

  const sheets = new Map<string, Sheet>()
  for (const storyId of storyOrder) {
    const shots = byStory.get(storyId)
    if (!shots) continue
    // A story id is "<title-id>--<story>", so a title id never collides with a page story id
    const key = shots.some((c) => c.fullscreen) ? storyId : storyId.split('--')[0]
    const sheet = sheets.get(key) ?? { file: `${key}.png`, rows: [] }
    sheet.rows.push({ label: shots[0].name, cells: modes.map((mode) => shots.find((c) => c.mode === mode)) })
    sheets.set(key, sheet)
  }
  return [...sheets.values()]
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Renders a sheet as a table: one row per story, one column per mode. */
export function sheetHtml(sheet: Sheet, modes: string[]): string {
  const head = `<tr><th></th>${modes.map((mode) => `<th>${escapeHtml(mode)}</th>`).join('')}</tr>`
  const rows = sheet.rows.map((row) => {
    const cells = row.cells.map((cell) =>
      cell ? `<td><img src="${pathToFileURL(cell.file).href}"></td>` : '<td class="missing">no screenshot</td>',
    )
    return `<tr><th>${escapeHtml(row.label)}</th>${cells.join('')}</tr>`
  })
  return `<!doctype html><style>
body{margin:0;background:#fff;color:#000;font:12px/1.4 sans-serif}
table{border-spacing:8px}
th{text-align:left;vertical-align:top;white-space:nowrap}
td{vertical-align:top;padding:0}
img{display:block}
.missing{color:#c00}
</style><table>${head}${rows.join('')}</table>`
}
