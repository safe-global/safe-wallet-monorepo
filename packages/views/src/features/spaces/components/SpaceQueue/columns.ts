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
  // Fits the gauge and the urgency chip up to "Blocked by #1234": a 5-digit nonce runs 6px into the cell padding
  // TODO(WA-4164/WA-4165): back to layout B width (128px) once the status chip leaves this column
  Status: 240,
  Action: 176,
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
