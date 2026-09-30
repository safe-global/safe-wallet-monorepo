/** Em-dash glyph used wherever a cell has no value to display. */
export const DASH = '—'

/** Row enter animation used by the list body. */
export const ROW_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

/**
 * Responsive grid template shared by the header and every row so columns line up.
 * The Account column is a flexible `1fr` track that absorbs the space freed when
 * the Balance column is hidden below `sm`. The cell-visibility class `HIDE_BALANCE`
 * must stay in sync with these tracks.
 */
export const GRID_COLS = [
  'grid-cols-[minmax(0,1fr)_11%_10%_16%_9%]',
  'sm:grid-cols-[minmax(0,1fr)_11%_9%_10%_16%_9%]',
].join(' ')

/**
 * Card chrome for each row — mirrors the Spaces accounts card (`SafeCardReadOnly`).
 * State-dependent classes (cursor / hover / selected) are layered on per row via `cn`.
 */
export const CARD_ROW_CLASS =
  'box-border grid w-full min-w-0 max-w-full items-center gap-2 rounded-3xl border-2 border-card bg-card py-4 pl-3 pr-3 transition-colors sm:pl-6 sm:pr-6'

/** Base class for a grid cell. */
export const CELL_BASE = 'flex min-w-0 items-center'

/** Responsive visibility for the Balance column, which collapses below `sm`. */
export const HIDE_BALANCE = 'hidden sm:flex'

/**
 * Column headers in display order. `hideClass` matches the per-cell visibility so the
 * label collapses together with its column. Widths are governed by `GRID_COLS`.
 */
export const COLUMNS: { label: string; hideClass: string; align?: 'right' }[] = [
  { label: 'Account', hideClass: '' },
  { label: 'Network', hideClass: '' },
  { label: 'Balance', hideClass: HIDE_BALANCE },
  { label: 'Score', hideClass: '' },
  { label: 'Status', hideClass: '' },
  { label: '', hideClass: '', align: 'right' },
]
