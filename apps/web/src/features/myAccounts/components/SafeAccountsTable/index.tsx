import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
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
  overviewKey,
  useSafeAccountRows,
  type AccountGroup,
  type AccountLine,
  type SafeSortColumn,
} from './useSafeAccountRows'
import SafeAccountTableRow, { type RowCheckbox } from './SafeAccountTableRow'
import ReorderableBody, { toggleExpanded } from './ReorderableBody'
import { SimilarityBandHeader } from './SimilarityBand'
import EntryDialog from '@/components/address-book/EntryDialog'

/** Renaming a safe = editing its address-book entry across every chain it lives on. */
type RenameTarget = { name: string; address: string; chainIds: string[] }

const toRenameTarget = (line: AccountLine): RenameTarget => ({
  name: line.contextMenu.name,
  address: line.contextMenu.address,
  chainIds: line.contextMenu.type === 'multi' ? line.contextMenu.chainIds : [line.contextMenu.chainId],
})

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
  /**
   * Lowercased address → similarity-cluster id. When set, contiguous rows sharing a cluster id are
   * rendered inside an "Address poisoning warning" band (tinted rows + a header). Pairs with
   * flaggedAddresses, which still drives the per-row ⚠️ (so a trusted anchor can sit in the band
   * without a ⚠️). Grouping is applied in the non-reorder body only for now.
   */
  similarityGroups?: Map<string, string>
  /** Enables a leading checkbox column and makes rows selectable. */
  selection?: SafeAccountsSelection
  /**
   * Re-enables the hover rename pencil on a selection surface (selection normally suppresses it) and
   * floats the rename dialog above a shadcn Dialog (--z-overlay: 1400). Used by the "Manage my account
   * list" modal, whose table is both selectable and rendered inside a shadcn Dialog.
   */
  allowRenameInDialog?: boolean
  /** Enables a leading drag-handle column and makes top-level accounts reorderable. */
  reorder?: SafeAccountsReorder
  /**
   * Whether the column headers can re-sort the table. Defaults to `true`. Surfaces with their own
   * sort-mode control (the Name / Last visited / Manual dropdown) pass `false` whenever the active
   * mode isn't Name, so that mode owns the order instead of being silently overridden by a header
   * click (Last visited and Manual have no column equivalent).
   */
  sortableColumns?: boolean
  /** Fired when a row's link is clicked; receives the clicked line so callers can track the safe. */
  onLinkClick?: (line: AccountLine) => void
  /**
   * Renders the table flush inside a card: no column header, no bordered container, and the Name
   * column flexes to fill the available width instead of being fixed. Used by the dashboard widget.
   */
  embedded?: boolean
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

/** Full-width header row that opens an address-poisoning similarity band (tint lives in the Table sx). */
/**
 * Pulls each similarity cluster's members together so they render as one contiguous band. The whole
 * cluster is placed at its LEAD's sorted position — the lead is the anchor (a member that's in a
 * cluster but NOT flagged, i.e. already trusted) if present, otherwise the first member in sort order.
 * Within the band the anchor(s) lead, then the look-alikes keep their sorted order. Non-clustered
 * groups stay in place. No-op when `similarityGroups` is empty.
 */
const orderGroupsBySimilarity = (
  groups: AccountGroup[],
  similarityGroups?: Map<string, string>,
  flaggedAddresses?: Set<string>,
): AccountGroup[] => {
  if (!similarityGroups || similarityGroups.size === 0) return groups

  const clusterOf = (group: AccountGroup) => similarityGroups.get(group.parent.address.toLowerCase())
  const isAnchor = (group: AccountGroup) => !flaggedAddresses?.has(group.parent.address.toLowerCase())

  const membersByCluster = new Map<string, AccountGroup[]>()
  const leadByCluster = new Map<string, AccountGroup>()
  for (const group of groups) {
    const cluster = clusterOf(group)
    if (!cluster) continue
    const members = membersByCluster.get(cluster)
    if (members) members.push(group)
    else membersByCluster.set(cluster, [group])
    // Lead = first-seen member (first in sort order), upgraded to an anchor if one appears.
    const lead = leadByCluster.get(cluster)
    if (!lead || (isAnchor(group) && !isAnchor(lead))) leadByCluster.set(cluster, group)
  }

  const result: AccountGroup[] = []
  for (const group of groups) {
    const cluster = clusterOf(group)
    if (!cluster) {
      result.push(group)
      continue
    }
    // Emit the whole cluster once, at its lead's position; skip the other members here.
    if (leadByCluster.get(cluster) !== group) continue
    const members = membersByCluster.get(cluster) ?? [group]
    result.push(...members.filter(isAnchor), ...members.filter((member) => !isAnchor(member)))
  }
  return result
}

const SafeAccountsTable = ({
  items,
  columns,
  actionsWidth,
  renderActions,
  flaggedAddresses,
  similarityGroups,
  selection,
  allowRenameInDialog = false,
  reorder,
  sortableColumns = true,
  onLinkClick,
  embedded = false,
  'data-testid': testId = 'safe-accounts-table',
}: SafeAccountsTableProps) => {
  const [overviewsByKey, setOverviewsByKey] = useState<Map<string, SafeOverview>>(new Map())

  // Rows report their lazily-fetched overviews here. RTK returns a stable object ref per cache entry
  // (a new ref only on a genuine refetch), so reference equality detects real updates; keep the
  // previous map when nothing new arrived, so a repeated report doesn't churn a re-render.
  const handleOverviewsLoaded = useCallback((overviews: SafeOverview[]) => {
    setOverviewsByKey((prev) => {
      let changed = false
      const next = new Map(prev)
      for (const overview of overviews) {
        const key = overviewKey(overview.chainId, overview.address.value)
        if (next.get(key) !== overview) {
          next.set(key, overview)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [])

  const { groups } = useSafeAccountRows(items, overviewsByKey)
  const [sort, setSort] = useState<SortState>({ orderBy: null, order: 'asc' })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null)

  // Selection surfaces are modals (trusted picker, manage, onboarding) where rename isn't offered by
  // default; the hover rename pencil is otherwise only for the navigable welcome/workspace tables. The
  // "Manage my account list" modal opts back in via `allowRenameInDialog`.
  const canRename = allowRenameInDialog || !selection
  const onRename = canRename ? (line: AccountLine) => setRenameTarget(toRenameTarget(line)) : undefined

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
    if (reorderActive || !sortableColumns || !sort.orderBy) return groups
    const orderBy = sort.orderBy
    return [...groups].sort((a, b) => compareGroups(a, b, orderBy, sort.order))
  }, [groups, sort, reorderActive, sortableColumns])

  // When an external sort-mode control takes over ordering (Last visited / Manual), clear any active
  // column sort so a stale header arrow and order don't linger if column sorting re-enables.
  useEffect(() => {
    if (!sortableColumns) setSort({ orderBy: null, order: 'asc' })
  }, [sortableColumns])

  // Pull similarity clusters together (non-reorder body) so each renders as one contiguous band.
  const displayGroups = useMemo(
    () => orderGroupsBySimilarity(sortedGroups, similarityGroups, flaggedAddresses),
    [sortedGroups, similarityGroups, flaggedAddresses],
  )

  const lines = useMemo<Array<{ line: AccountLine; groupKey: string; group: AccountGroup }>>(() => {
    const result: Array<{ line: AccountLine; groupKey: string; group: AccountGroup }> = []
    for (const group of displayGroups) {
      result.push({ line: group.parent, groupKey: group.parent.key, group })
      if (group.children.length > 0 && expanded.has(group.parent.key)) {
        for (const child of group.children) {
          result.push({ line: child, groupKey: group.parent.key, group })
        }
      }
    }
    return result
  }, [displayGroups, expanded])

  const handleSort = (column: SafeSortColumn) =>
    setSort((prev) => ({
      orderBy: column,
      order: prev.orderBy === column && prev.order === 'asc' ? 'desc' : 'asc',
    }))

  const toggle = (key: string) => setExpanded((prev) => toggleExpanded(prev, key))

  if (items.length === 0) return null

  return (
    <Box data-testid={testId} sx={{ width: '100%' }}>
      <TableContainer
        sx={
          embedded
            ? { width: '100%', overflowX: 'visible' }
            : {
                width: '100%',
                // Reorder mode floats the drag grip in the left gutter, outside the card — clipping it
                // would hide the handle, so drop the horizontal scroll container while reordering.
                overflowX: reorderActive ? 'visible' : 'auto',
                borderRadius: '16px',
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'border.light',
                // Keep the last row off the rounded bottom edge (the header already insets from the top).
                pb: 1,
              }
        }
      >
        <Table
          sx={{
            tableLayout: 'fixed',
            minWidth: embedded ? undefined : minWidth,
            borderCollapse: 'separate',
            borderSpacing: 0,
            // The base theme tints every MuiTableRow green on hover; suppress it on the <tr> (otherwise
            // it bleeds green into the inset corners) and instead paint a grey pill (the same --muted as
            // the safe-selector dropdown) on the row's cells — inset and rounded like the dropdown rows.
            // Painting the cells (not the <tr>) lets the first/last cells' transparent side borders inset
            // the fill from the panel edges. Locked rows stay un-hovered.
            '& .MuiTableBody-root .MuiTableRow-root:hover': { backgroundColor: 'transparent' },
            '& .MuiTableBody-root .MuiTableRow-root:not([data-disabled]):hover .MuiTableCell-root': {
              backgroundColor: 'var(--muted)',
            },
            '& .MuiTableBody-root .MuiTableRow-root:not([data-disabled]):hover .MuiTableCell-root:first-of-type': {
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
            },
            '& .MuiTableBody-root .MuiTableRow-root:not([data-disabled]):hover .MuiTableCell-root:last-of-type': {
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
            },
            // Transparent top/bottom borders (with background-clip) inset the hover pill vertically so it
            // floats clear of the separators. Set here — not per-cell — because the base theme forces
            // cell borderBottom to `none` at a specificity a per-cell sx can't beat (which is why only
            // the bottom touched). The outer cells' horizontal inset borders live in the cell sx.
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              backgroundClip: 'padding-box',
            },
            // Row separator, drawn as a 1px line at the bottom of the <tr> (keyed off data-divider,
            // absent on the last row). It lives on the row — not the cells — so the cells' transparent
            // top/bottom borders can inset the hover pill clear of the separator. Inset 4px each side to
            // line up with the pill.
            '& .MuiTableBody-root .MuiTableRow-root[data-divider]': {
              backgroundImage:
                'linear-gradient(to right, transparent 4px, var(--color-border-light) 4px, var(--color-border-light) calc(100% - 4px), transparent calc(100% - 4px))',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'bottom',
              backgroundSize: '100% 1px',
            },
            // Address-poisoning similarity band: paint the header + member rows yellow, including the
            // 6px inset borders above, so the run reads as one continuous block rather than separated
            // pills. Placed after the hover rule so the same-specificity hover override below wins.
            '& .MuiTableBody-root .MuiTableRow-root[data-band-header] .MuiTableCell-root, & .MuiTableBody-root .MuiTableRow-root[data-highlighted] .MuiTableCell-root':
              {
                backgroundColor: 'var(--color-yellow-50)',
                borderTopColor: 'var(--color-yellow-50)',
                borderBottomColor: 'var(--color-yellow-50)',
              },
            // Keep the band yellow on hover (beat the grey hover pill, which has equal specificity).
            '& .MuiTableBody-root .MuiTableRow-root[data-band-header]:hover .MuiTableCell-root, & .MuiTableBody-root .MuiTableRow-root[data-highlighted]:hover .MuiTableCell-root':
              {
                backgroundColor: 'var(--color-yellow-50)',
              },
            // Every band member (incl. the trusted anchor) renders as its own rounded, yellow-bordered
            // card. The border is drawn with inset box-shadows on the row's cells (continuous top/bottom
            // on every cell; left only on the first, right only on the last) so it follows the first/last
            // cell radii into a rounded rectangle with no internal vertical lines.
            '& .MuiTableBody-root .MuiTableRow-root[data-highlighted] .MuiTableCell-root': {
              boxShadow: 'inset 0 1px 0 var(--color-yellow-400), inset 0 -1px 0 var(--color-yellow-400)',
            },
            '& .MuiTableBody-root .MuiTableRow-root[data-highlighted] .MuiTableCell-root:first-of-type': {
              boxShadow:
                'inset 1px 0 0 var(--color-yellow-400), inset 0 1px 0 var(--color-yellow-400), inset 0 -1px 0 var(--color-yellow-400)',
              borderTopLeftRadius: '8px',
              borderBottomLeftRadius: '8px',
            },
            '& .MuiTableBody-root .MuiTableRow-root[data-highlighted] .MuiTableCell-root:last-of-type': {
              boxShadow:
                'inset -1px 0 0 var(--color-yellow-400), inset 0 1px 0 var(--color-yellow-400), inset 0 -1px 0 var(--color-yellow-400)',
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
            },
          }}
        >
          {/* Embedded (headerless) tables need a colgroup to keep fixed-layout column widths; the Name
              column is left unsized so it flexes to fill the card, while the stat columns stay fixed. */}
          {embedded && (
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column.id} style={column.id === 'name' ? undefined : { width: column.width }} />
              ))}
            </colgroup>
          )}

          {!embedded && (
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
                    {column.sortable && column.sortKey && !reorderActive && sortableColumns ? (
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
          )}

          {reorder ? (
            <ReorderableBody
              groups={displayGroups}
              columns={visibleColumns}
              flaggedAddresses={flaggedAddresses}
              similarityGroups={similarityGroups}
              expanded={expanded}
              setExpanded={setExpanded}
              renderActions={renderActions}
              onRename={onRename}
              onLinkClick={onLinkClick}
              getCheckbox={selection ? (group, line) => getRowCheckbox(group, line, selection) : undefined}
              onSelectToggle={selection ? (line, next) => selection.onToggle(line, next) : undefined}
              onReorder={reorder.onReorder}
              onOverviewsLoaded={handleOverviewsLoaded}
            />
          ) : (
            <TableBody>
              {lines.flatMap(({ line, groupKey, group }, index) => {
                const clusterId = similarityGroups?.get(line.address.toLowerCase())
                const prevClusterId =
                  index > 0 ? similarityGroups?.get(lines[index - 1].line.address.toLowerCase()) : undefined
                // Open a band once, on the first row of each contiguous cluster run.
                const bandHeader =
                  clusterId && clusterId !== prevClusterId ? (
                    <SimilarityBandHeader key={`band-${clusterId}`} colSpan={visibleColumns.length} />
                  ) : null

                const row = (
                  <SafeAccountTableRow
                    key={line.key}
                    line={line}
                    columns={visibleColumns}
                    expanded={line.expandable ? expanded.has(groupKey) : undefined}
                    isFlagged={flaggedAddresses?.has(line.address.toLowerCase())}
                    highlighted={Boolean(clusterId)}
                    renderActions={renderActions}
                    onRename={onRename}
                    checkbox={selection ? getRowCheckbox(group, line, selection) : undefined}
                    onSelectToggle={selection ? (next) => selection.onToggle(line, next) : undefined}
                    onToggle={line.expandable ? () => toggle(groupKey) : undefined}
                    onLinkClick={onLinkClick}
                    showDivider={index < lines.length - 1 && lines[index + 1].groupKey !== groupKey}
                    onOverviewsLoaded={handleOverviewsLoaded}
                  />
                )

                return bandHeader ? [bandHeader, row] : [row]
              })}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {renameTarget && (
        <EntryDialog
          handleClose={() => setRenameTarget(null)}
          defaultValues={{ name: renameTarget.name, address: renameTarget.address }}
          chainIds={renameTarget.chainIds}
          // In a modal surface, sit above the shadcn Dialog (--z-overlay: 1400) instead of behind it.
          sx={allowRenameInDialog ? { zIndex: 1450 } : undefined}
        />
      )}
    </Box>
  )
}

export default SafeAccountsTable
