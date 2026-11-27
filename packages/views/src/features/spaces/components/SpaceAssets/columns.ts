export const ASSETS_COLUMNS = ['Toggle', 'Asset', 'Network', 'Balance', 'Value'] as const

export type AssetsColumn = (typeof ASSETS_COLUMNS)[number]

/** Widths in px, cell padding included; Asset takes the rest. Toggle matches the queue's Nonce, so band labels line up */
export const ASSETS_COLUMN_WIDTHS: Record<AssetsColumn, number | undefined> = {
  Toggle: 64,
  Asset: undefined,
  Network: 160,
  Balance: 176,
  Value: 136,
}

/** Asset keeps at least 200px */
export const ASSETS_TABLE_MIN_WIDTH = 'min-w-[736px]'
