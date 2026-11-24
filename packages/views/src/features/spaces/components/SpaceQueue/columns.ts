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

/** The queue table's floor: below it, the table scrolls sideways */
export const QUEUE_TABLE_MIN_WIDTH = 'min-w-[1150px]'

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
