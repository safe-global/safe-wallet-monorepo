import type { SafeSortColumn } from './useSafeAccountRows'

export type SafeAccountColumnId =
  | 'select'
  | 'name'
  | 'threshold'
  | 'networks'
  | 'workspaces'
  | 'pending'
  | 'balance'
  | 'actions'

export type SafeAccountColumn = {
  id: SafeAccountColumnId
  label: string
  sortable: boolean
  /** The group sort key backing this column (only for sortable columns). */
  sortKey?: SafeSortColumn
  align?: 'center' | 'right'
  width?: string
}

/**
 * Column set for the accounts table, in render order. Balance and Pending are intentionally
 * not sortable. Widths are fixed pixels (the table uses `table-layout: fixed`) so the Name
 * column can't stretch to fit a long name — it's sized to hold the full account address, and
 * long names truncate within it. The sum drives a horizontal scroll on narrow viewports.
 */
export const SAFE_ACCOUNT_COLUMNS: SafeAccountColumn[] = [
  { id: 'name', label: 'Name', sortable: true, sortKey: 'name', width: '404px' },
  { id: 'threshold', label: 'Threshold', sortable: true, sortKey: 'threshold', align: 'center', width: '96px' },
  { id: 'networks', label: 'Networks', sortable: true, sortKey: 'networks', align: 'center', width: '96px' },
  { id: 'workspaces', label: 'Workspaces', sortable: true, sortKey: 'workspaces', align: 'center', width: '96px' },
  { id: 'pending', label: 'Pending', sortable: false, align: 'center', width: '100px' },
  { id: 'balance', label: 'Balance', sortable: false, align: 'right', width: '96px' },
  { id: 'actions', label: '', sortable: false, align: 'right', width: '50px' },
]

/**
 * Leading checkbox column, prepended by the table only when selection mode is active. Kept out of
 * SAFE_ACCOUNT_COLUMNS so callers passing an explicit `columns` list are never affected by it.
 */
export const SELECT_COLUMN: SafeAccountColumn = {
  id: 'select',
  label: '',
  sortable: false,
  align: 'center',
  width: '48px',
}
