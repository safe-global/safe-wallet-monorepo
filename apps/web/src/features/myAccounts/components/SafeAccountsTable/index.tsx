import { useMemo, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import type { AllSafeItems } from '@/hooks/safes'
import { cn } from '@/utils/cn'
import { SAFE_ACCOUNT_COLUMNS, SELECT_COLUMN, type SafeAccountColumnId } from './columns'
import {
  compareGroups,
  useSafeAccountRows,
  type AccountGroup,
  type AccountLine,
  type SafeSortColumn,
} from './useSafeAccountRows'
import SafeAccountTableRow, { type RowCheckbox } from './SafeAccountTableRow'
import ReorderableBody from './ReorderableBody'

type SortState = { orderBy: SafeSortColumn | null; order: 'asc' | 'desc' }

/**
 * Optional selection (checkbox) mode. The table deals only in leaf keys (`${chainId}:${address}`,
 * which equal a leaf AccountLine's `key`); the caller owns any multi-chain aggregate key. A group
 * row's checkbox state is derived from its children.
 */
export type SafeAccountsSelection = {
  /** Selected leaf keys (singles + per-chain children). */
  selectedKeys: Set<string>
  /** Fired on a checkbox toggle; `line` is the toggled row (leaf or group), `nextChecked` the desired state. */
  onToggle: (line: AccountLine, nextChecked: boolean) => void
  /** Global cap reached — unselected leaves and empty groups render disabled. */
  isAtLimit?: boolean
  /** Leaf keys to disable (and dim) regardless of the cap — e.g. safes already in the workspace. */
  disabledKeys?: Set<string>
  /** Tooltip explaining why `disabledKeys` rows are locked (e.g. "This safe is already part of your workspace"). */
  disabledReason?: string
}

const getRowCheckbox = (group: AccountGroup, line: AccountLine, selection: SafeAccountsSelection): RowCheckbox => {
  const { selectedKeys, isAtLimit, disabledKeys, disabledReason } = selection

  if (line.variant === 'group') {
    const childKeys = group.children.map((child) => child.key)
    const selectedCount = childKeys.filter((key) => selectedKeys.has(key)).length
    const checked = childKeys.length > 0 && selectedCount === childKeys.length
    const lockedByReason = childKeys.length > 0 && childKeys.every((key) => disabledKeys?.has(key))
    return {
      checked,
      indeterminate: selectedCount > 0 && !checked,
      disabled: lockedByReason || (Boolean(isAtLimit) && selectedCount === 0),
      disabledReason: lockedByReason ? disabledReason : undefined,
      ariaLabel: line.displayName,
    }
  }

  const lockedByReason = Boolean(disabledKeys?.has(line.key))
  const checked = selectedKeys.has(line.key)
  return {
    checked,
    indeterminate: false,
    disabled: lockedByReason || (Boolean(isAtLimit) && !checked),
    disabledReason: lockedByReason ? disabledReason : undefined,
    ariaLabel: line.displayName,
  }
}

/** Enables drag-and-drop reordering of the top-level accounts. */
export type SafeAccountsReorder = {
  /** Fired on drop with the reordered top-level account addresses, in display order. */
  onReorder: (orderedAddresses: string[]) => void
}

export type SafeAccountsTableProps = {
  items: AllSafeItems
  /** Columns to show, in the canonical order. Defaults to the full set. */
  columns?: SafeAccountColumnId[]
  /** Overrides the actions column width — e.g. when `renderActions` renders a button instead of a menu. */
  actionsWidth?: string
  /** Replaces the default context-menu actions cell for each row (e.g. an "Add to workspace" button). */
  renderActions?: (line: AccountLine) => ReactNode
  /** Lowercased addresses to flag with a "High similarity" warning badge. */
  flaggedAddresses?: Set<string>
  /** Enables a leading checkbox column and makes rows selectable. */
  selection?: SafeAccountsSelection
  /** Enables a leading drag-handle column and makes top-level accounts reorderable. */
  reorder?: SafeAccountsReorder
  onLinkClick?: () => void
  'data-testid'?: string
}

// Header labels sit on a light-grey rounded bar (see the header cell sx below), matching the design.
const headerSx = {
  textTransform: 'uppercase',
  fontSize: '12px',
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: 'text.secondary',
  whiteSpace: 'nowrap',
  py: 1.25,
  // Match the body cells' slim padding so labels align with their columns.
  px: 1,
  // The grey bar sits inset 4px from the panel edges: transparent borders +
  // padding-box clip shrink the painted background without moving the cells.
  // `&&` outranks the theme's MuiTableCell-head border-bottom.
  backgroundClip: 'padding-box',
  '&&': { border: '4px solid transparent', borderLeft: 'none', borderRight: 'none' },
  '&&:first-of-type': { pl: 2, borderLeft: '4px solid transparent' },
  '&&:last-of-type': { pr: 2, borderRight: '4px solid transparent' },
} as const

const SafeAccountsTable = ({
  items,
  columns,
  actionsWidth,
  renderActions,
  flaggedAddresses,
  selection,
  reorder,
  onLinkClick,
  'data-testid': testId = 'safe-accounts-table',
}: SafeAccountsTableProps) => {
  const { groups } = useSafeAccountRows(items)
  const [sort, setSort] = useState<SortState>({ orderBy: null, order: 'asc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // While reordering, the incoming (manual) order is authoritative: column-header sorting is
  // suppressed and multi-chain groups collapse so each row is a single draggable account.
  const reorderActive = Boolean(reorder)

  const visibleColumns = useMemo(() => {
    const base = columns ? SAFE_ACCOUNT_COLUMNS.filter((c) => columns.includes(c.id)) : SAFE_ACCOUNT_COLUMNS
    const withActions = actionsWidth ? base.map((c) => (c.id === 'actions' ? { ...c, width: actionsWidth } : c)) : base
    // Reorder mode adds no column: the drag handle floats in the Name cell's left gutter, so the
    // table keeps the same width as the other sort modes (no differential horizontal scrollbar).
    if (selection) return [SELECT_COLUMN, ...withActions]
    return withActions
  }, [columns, actionsWidth, selection])

  const minWidth = useMemo(
    () => visibleColumns.reduce((sum, column) => sum + parseInt(column.width ?? '0', 10), 0),
    [visibleColumns],
  )

  const sortedGroups = useMemo(() => {
    if (reorderActive || !sort.orderBy) return groups
    const orderBy = sort.orderBy
    return [...groups].sort((a, b) => compareGroups(a, b, orderBy, sort.order))
  }, [groups, sort, reorderActive])

  const lines = useMemo<Array<{ line: AccountLine; groupKey: string; group: AccountGroup }>>(() => {
    const result: Array<{ line: AccountLine; groupKey: string; group: AccountGroup }> = []
    for (const group of sortedGroups) {
      result.push({ line: group.parent, groupKey: group.parent.key, group })
      if (group.children.length > 0 && expanded.has(group.parent.key)) {
        for (const child of group.children) {
          result.push({ line: child, groupKey: group.parent.key, group })
        }
      }
    }
    return result
  }, [sortedGroups, expanded])

  const handleSort = (column: SafeSortColumn) =>
    setSort((prev) => ({
      orderBy: column,
      order: prev.orderBy === column && prev.order === 'asc' ? 'desc' : 'asc',
    }))

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })

  if (items.length === 0) return null

  return (
    <Box data-testid={testId} sx={{ width: '100%' }}>
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          borderRadius: '16px',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'border.light',
        }}
      >
        <Table
          sx={{
            tableLayout: 'fixed',
            minWidth,
            borderCollapse: 'separate',
            borderSpacing: 0,
            // The base theme tints every MuiTableRow green on hover; the account tables use the same
            // grey as the safe-selector dropdown instead (locked rows stay un-hovered).
            '& .MuiTableBody-root .MuiTableRow-root:not([data-disabled]):hover': { backgroundColor: 'var(--muted)' },
          }}
        >
          <TableHead>
            <TableRow>
              {visibleColumns.map((column, index) => (
                <TableCell
                  key={column.id}
                  sortDirection={sort.orderBy === column.sortKey ? sort.order : false}
                  className={cn(
                    'bg-muted',
                    index === 0 && 'rounded-l-lg',
                    index === visibleColumns.length - 1 && 'rounded-r-lg',
                  )}
                  sx={{ ...headerSx, width: column.width, textAlign: column.align ?? 'left' }}
                >
                  {column.sortable && column.sortKey && !reorderActive ? (
                    <TableSortLabel
                      active={sort.orderBy === column.sortKey}
                      direction={sort.orderBy === column.sortKey ? sort.order : 'asc'}
                      onClick={() => handleSort(column.sortKey as SafeSortColumn)}
                      data-testid={`account-sort-${column.id}`}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {reorder ? (
            <ReorderableBody
              groups={sortedGroups}
              columns={visibleColumns}
              flaggedAddresses={flaggedAddresses}
              renderActions={renderActions}
              onLinkClick={onLinkClick}
              onReorder={reorder.onReorder}
            />
          ) : (
            <TableBody>
              {lines.map(({ line, groupKey, group }, index) => (
                <SafeAccountTableRow
                  key={line.key}
                  line={line}
                  columns={visibleColumns}
                  expanded={line.expandable ? expanded.has(groupKey) : undefined}
                  isFlagged={flaggedAddresses?.has(line.address.toLowerCase())}
                  renderActions={renderActions}
                  checkbox={selection ? getRowCheckbox(group, line, selection) : undefined}
                  onSelectToggle={selection ? (next) => selection.onToggle(line, next) : undefined}
                  onToggle={line.expandable ? () => toggle(groupKey) : undefined}
                  onLinkClick={onLinkClick}
                  showDivider={index < lines.length - 1 && lines[index + 1].groupKey !== groupKey}
                />
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SafeAccountsTable
