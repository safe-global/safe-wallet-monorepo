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
import { SAFE_ACCOUNT_COLUMNS, type SafeAccountColumnId } from './columns'
import { compareGroups, useSafeAccountRows, type AccountLine, type SafeSortColumn } from './useSafeAccountRows'
import SafeAccountTableRow from './SafeAccountTableRow'

type SortState = { orderBy: SafeSortColumn | null; order: 'asc' | 'desc' }

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
  onLinkClick,
  'data-testid': testId = 'safe-accounts-table',
}: SafeAccountsTableProps) => {
  const { groups } = useSafeAccountRows(items)
  const [sort, setSort] = useState<SortState>({ orderBy: null, order: 'asc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const visibleColumns = useMemo(() => {
    const base = columns ? SAFE_ACCOUNT_COLUMNS.filter((c) => columns.includes(c.id)) : SAFE_ACCOUNT_COLUMNS
    return actionsWidth ? base.map((c) => (c.id === 'actions' ? { ...c, width: actionsWidth } : c)) : base
  }, [columns, actionsWidth])

  const minWidth = useMemo(
    () => visibleColumns.reduce((sum, column) => sum + parseInt(column.width ?? '0', 10), 0),
    [visibleColumns],
  )

  const sortedGroups = useMemo(() => {
    if (!sort.orderBy) return groups
    const orderBy = sort.orderBy
    return [...groups].sort((a, b) => compareGroups(a, b, orderBy, sort.order))
  }, [groups, sort])

  const lines = useMemo<Array<{ line: AccountLine; groupKey: string }>>(() => {
    const result: Array<{ line: AccountLine; groupKey: string }> = []
    for (const group of sortedGroups) {
      result.push({ line: group.parent, groupKey: group.parent.key })
      if (group.children.length > 0 && expanded.has(group.parent.key)) {
        for (const child of group.children) {
          result.push({ line: child, groupKey: group.parent.key })
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
        sx={{ width: '100%', overflowX: 'auto', borderRadius: '16px', backgroundColor: 'background.paper' }}
      >
        <Table sx={{ tableLayout: 'fixed', minWidth, borderCollapse: 'separate', borderSpacing: 0 }}>
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
                  {column.sortable && column.sortKey ? (
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

          <TableBody>
            {lines.map(({ line, groupKey }, index) => (
              <SafeAccountTableRow
                key={line.key}
                line={line}
                columns={visibleColumns}
                expanded={line.expandable ? expanded.has(groupKey) : undefined}
                isFlagged={flaggedAddresses?.has(line.address.toLowerCase())}
                renderActions={renderActions}
                onToggle={line.expandable ? () => toggle(groupKey) : undefined}
                onLinkClick={onLinkClick}
                showDivider={index < lines.length - 1 && lines[index + 1].groupKey !== groupKey}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default SafeAccountsTable
