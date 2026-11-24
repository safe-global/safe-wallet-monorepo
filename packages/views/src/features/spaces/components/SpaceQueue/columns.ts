export const QUEUE_COLUMNS = ['Nonce', 'Safe', 'Transaction', 'Details', 'Status', 'Action'] as const

export type QueueColumn = (typeof QUEUE_COLUMNS)[number]

/**
 * Layout B's column widths in px, the 16px cell padding included. Details has none: it takes the rest. The same in
 * every grouping, so switching it doesn't move the columns. The header and the skeleton rows both read this map.
 */
export const QUEUE_COLUMN_WIDTHS: Record<QueueColumn, number | undefined> = {
  Nonce: 64,
  Safe: 160,
  Transaction: 160,
  Details: undefined,
  // Only the gauge: a 16px icon and a 5ch count (71px). Pending and expired states sit in the Action column
  Status: 104,
  // Fits "Blocked by #8888" and its arrow beside the More button (169px), the widest action
  Action: 204,
}

/**
 * The queue table's floor, Details at 232px: below it, the table scrolls sideways inside its panel. It fits a 1280px
 * window with the 230px sidebar open (a 1002px panel), with room for a 15px classic scrollbar.
 */
export const QUEUE_TABLE_MIN_WIDTH = 'min-w-[960px]'

// The panel table's outer cells have a 4px transparent edge: painted the panel's colour, so nothing shows through it.
// Important, as the table's CSS module isn't in a layer. Its header and hover fills still win over the background.
/** The Nonce and Action cells stay in view while a panel narrower than the table's floor scrolls under them */
export const QUEUE_STICKY_CELL: Partial<Record<QueueColumn, string>> = {
  Nonce: 'sticky left-0 z-[1] bg-[var(--color-background-paper)] border-l-[var(--color-background-paper)]!',
  Action: 'sticky right-0 z-[1] bg-[var(--color-background-paper)] border-r-[var(--color-background-paper)]!',
}

/** Where a column starts, as a CSS length from the table's left edge: Details and the columns after it hang off the right */
export const getQueueColumnStart = (column: QueueColumn): string => {
  const index = QUEUE_COLUMNS.indexOf(column)
  const flexible = QUEUE_COLUMNS.indexOf('Details')
  const sum = (columns: readonly QueueColumn[]) =>
    columns.reduce((total, label) => total + (QUEUE_COLUMN_WIDTHS[label] ?? 0), 0)
  return index <= flexible
    ? `${sum(QUEUE_COLUMNS.slice(0, index))}px`
    : `calc(100% - ${sum(QUEUE_COLUMNS.slice(index))}px)`
}
