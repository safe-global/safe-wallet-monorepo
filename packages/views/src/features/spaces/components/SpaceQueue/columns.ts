export const QUEUE_COLUMNS = ['Nonce', 'Safe', 'Transaction', 'Details', 'Note', 'Status', 'Action'] as const

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
  // Only the note icon. The header sets the width in use: see QUEUE_NOTE_WIDTHS
  Note: 68,
  // Only the gauge: a 16px icon and a 5ch count (71px). Pending and expired states sit in the Action column
  Status: 104,
  // Fits "Blocked by #8888" and its arrow beside the More button (169px), the widest action
  Action: 204,
}

/** The queue table's floor: Details at 268px, so it fits the 1002px panel of a 1280px window with the sidebar open */
export const QUEUE_TABLE_MIN_WIDTH = 'min-w-[960px]'

/**
 * How a transaction's note shows, by the panel's width: `inline` puts its icon in Details and gives the Note column
 * no width, `icon` gives it the Note column, `text` widens the column for the note's text.
 */
export type QueueNoteDisplay = 'inline' | 'icon' | 'text'

const NOTE_COLUMN_MIN_PANEL_WIDTH = 1050
const NOTE_TEXT_MIN_PANEL_WIDTH = 1880

export const QUEUE_NOTE_WIDTHS: Record<QueueNoteDisplay, number> = { inline: 0, icon: 68, text: 320 }

export const getQueueNoteDisplay = (panelWidth: number): QueueNoteDisplay => {
  if (panelWidth >= NOTE_TEXT_MIN_PANEL_WIDTH) return 'text'
  return panelWidth >= NOTE_COLUMN_MIN_PANEL_WIDTH ? 'icon' : 'inline'
}

/** The columns that stay in view while the table scrolls sideways in its panel (`data-pin`, see table.module.css) */
export const QUEUE_PINNED_COLUMNS: Partial<Record<QueueColumn, 'start' | 'end'>> = { Nonce: 'start', Action: 'end' }

// 80px: past the pinned Nonce column and the cell's padding; 100cqw is the panel's width (an @container)
/** A band's or conflict's label: in view beside the pinned nonce, and as wide as the panel, while the table scrolls */
// Not the `sticky` class: the web app's globals.css gives `.sticky` a paper background and right: 0 below 600px
export const QUEUE_ROW_LABEL = '[position:sticky] left-[80px] max-w-[calc(100cqw-100px)]'

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
