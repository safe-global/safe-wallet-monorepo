import { useMemo, type MouseEvent, type ReactNode } from 'react'
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { useForkRef } from '@mui/material/utils'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useRowOverviews } from './useRowOverviews'
import { GripVertical, TriangleAlert } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import { SafeInfoDisplay } from '@/components/common/AccountRow'
import MultiAccountContextMenu from '@/components/common/SafeListContextMenu/MultiAccountContextMenu'
import FiatBalance from '@/components/common/FiatBalance'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { cn } from '@/utils/cn'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import type { AccountLine } from './useSafeAccountRows'
import type { SafeAccountColumn } from './columns'
import { PendingBadge, ThresholdBadge, formatPendingLabel } from '@/components/common/AccountBadges'
import { Checkbox } from '@/components/ui/checkbox'
import { WorkspaceAvatars } from './cells'

/** Precomputed checkbox state for a selectable row (see SafeAccountsSelection). */
export type RowCheckbox = {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
  /** When set, the row is dimmed and the checkbox shows this tooltip on hover. */
  disabledReason?: string
  ariaLabel?: string
}

type SafeAccountTableRowProps = {
  line: AccountLine
  columns: SafeAccountColumn[]
  expanded?: boolean
  /** Draw a bottom divider — only true at the boundary between top-level accounts, not within a group. */
  showDivider?: boolean
  /** Flags the row with an inline look-alike ⚠️ after the name (address-poisoning defence). */
  isFlagged?: boolean
  /** Tints the row (warning background) as a member of an address-poisoning similarity group. */
  highlighted?: boolean
  /** Replaces the default context-menu actions cell (e.g. an "Add to workspace" button). */
  renderActions?: (line: AccountLine) => ReactNode
  /** When set, adds the hover rename pencil to the identity cell (non-modal surfaces). */
  onRename?: (line: AccountLine) => void
  /** When set, a leading checkbox cell is rendered in selection mode. */
  checkbox?: RowCheckbox
  onSelectToggle?: (nextChecked: boolean) => void
  onToggle?: () => void
  onLinkClick?: (line: AccountLine) => void
  /** Drag-and-drop wiring from @hello-pangea/dnd — set only on the draggable parent row. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  rowRef?: (element: HTMLElement | null) => void
  rowDraggableProps?: DraggableProvidedDraggableProps
  isDragging?: boolean
  /** Reports this row's lazily-fetched Safe overviews up to the table so it can fill balance/threshold. */
  onOverviewsLoaded: (overviews: SafeOverview[]) => void
}

/** Inline look-alike marker shown right after the name of a flagged (address-poisoning) row. */
const SimilarityWarningIcon = () => (
  <TriangleAlert
    size={14}
    className="shrink-0 text-yellow-800 dark:text-[var(--color-warning-main)]"
    aria-label="Possible address poisoning"
  />
)

// Shares the dropdown's row identity cell: clip-gated name/address tooltips and copy/explorer icons
// revealed on row hover. Single/parent rows lead with the blockie identicon; per-chain child rows
// carry no icon (the chain is already named beside them) — a blank icon-width spacer keeps their name
// aligned under the parent's. `onRename`, when set, adds the hover rename pencil (non-modal surfaces).
const NameCellContent = ({
  line,
  isFlagged,
  onRename,
}: {
  line: AccountLine
  isFlagged?: boolean
  onRename?: () => void
}) => {
  const chainConfig = useChain(line.chainId)
  // Explorer links are per-chain, so only single safes and per-chain child rows get one — never the
  // multi-chain parent, whose chainId is just the first network's. On child rows (address hidden) the
  // link rides next to the chain name; SafeInfoDisplay places it there.
  const explorerLink =
    line.variant !== 'group' && chainConfig ? getBlockExplorerLink(chainConfig, line.address) : undefined

  // Empty spacer for child rows keeps their name aligned under the parent's (which fills it with the
  // blockie identicon).
  const leading = line.variant === 'child' ? null : <Identicon address={line.address} />

  return (
    <SafeInfoDisplay
      name={line.displayName}
      address={line.address}
      leading={<span className="flex w-10 items-center">{leading}</span>}
      hideAddress={!line.showAddress}
      explorerLink={explorerLink}
      onRename={onRename}
      nameAdornment={isFlagged ? <SimilarityWarningIcon /> : undefined}
      nameVariant="paragraph-bold"
      className="min-w-0"
    />
  )
}

const NameCell = ({
  line,
  expanded,
  isFlagged,
  disableLink,
  onToggle,
  onLinkClick,
  onRename,
}: {
  line: AccountLine
  expanded?: boolean
  isFlagged?: boolean
  /** In selection mode the row itself toggles the checkbox, so the name never navigates. */
  disableLink?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
  onRename?: () => void
}) => {
  const content = <NameCellContent line={line} isFlagged={isFlagged} onRename={onRename} />

  if (line.expandable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-testid="account-group-toggle"
        className="hover:bg-muted/40 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center rounded-lg px-2 py-1 text-left transition-colors"
      >
        {content}
      </button>
    )
  }

  if (line.href && !disableLink) {
    return (
      <NextLink href={line.href} onClick={onLinkClick} data-testid="account-row-link" className="block">
        {content}
      </NextLink>
    )
  }

  return content
}

// Absolutely positioned so entering sort mode never shifts the row content — hidden until the row is
// hovered/focused, or while it's dragging. Two placements, both reserving no layout space:
//  • gutter (default): floats in the empty gutter left of the table, used by the page lists where the
//    Name cell leads and there's room outside the table.
//  • inline: sits in the leading checkbox cell's own left padding (selection surfaces like the Manage
//    list, whose table is inside a horizontally-clipping scroll container with no outer gutter).
const ReorderHandle = ({
  dragHandleProps,
  isDragging,
  inline,
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
  inline?: boolean
}) => (
  <span
    {...dragHandleProps}
    data-testid="account-drag-handle"
    aria-label="Drag to reorder"
    className={cn(
      'text-muted-foreground hover:text-foreground absolute inset-y-0 flex cursor-grab items-center justify-center transition-opacity active:cursor-grabbing',
      inline ? 'left-0 w-4' : '-left-8 w-8',
      isDragging ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
    )}
  >
    <GripVertical className="size-4" />
  </span>
)

const SelectCell = ({
  checkbox,
  onSelectToggle,
}: {
  checkbox?: RowCheckbox
  onSelectToggle?: (next: boolean) => void
}) => (
  <div className="flex items-center justify-center">
    {checkbox && (
      <Checkbox
        checked={checkbox.checked}
        indeterminate={checkbox.indeterminate}
        disabled={checkbox.disabled}
        onCheckedChange={(next) => onSelectToggle?.(Boolean(next))}
        aria-label={`Select ${checkbox.ariaLabel ?? ''}`.trim()}
        data-testid="account-select-checkbox"
      />
    )}
  </div>
)

const CellContent = ({ column, line }: { column: SafeAccountColumn; line: AccountLine }): ReactNode => {
  switch (column.id) {
    case 'threshold':
      return (
        <ThresholdBadge
          threshold={line.threshold}
          owners={line.owners}
          iconOnly={line.thresholdMixed}
          loading={!line.dataLoaded}
        />
      )
    case 'networks':
      return line.networks ? (
        <BaseAccountItem.ChainBadge safes={line.networks} />
      ) : (
        <BaseAccountItem.ChainBadge chainId={line.chainId} />
      )
    case 'workspaces':
      return <WorkspaceAvatars spaces={line.workspaces} />
    case 'pending': {
      const pendingBadge = (
        <PendingBadge
          count={line.pending}
          awaitingConfirmation={line.awaitingConfirmation}
          loading={!line.dataLoaded}
        />
      )
      // Only a rendered badge (loaded and non-zero) gets the hover breakdown; a skeleton/empty cell has nothing to explain.
      if (!line.dataLoaded || line.pending <= 0) return pendingBadge
      return (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>{pendingBadge}</TooltipTrigger>
          <TooltipContent>{formatPendingLabel(line.pending, line.awaitingConfirmation)}</TooltipContent>
        </Tooltip>
      )
    }
    case 'balance':
      if (line.undeployed) {
        return <NotActivatedBadge isActivating={line.isActivating} />
      }
      return line.dataLoaded ? <FiatBalance value={line.balance} /> : <Skeleton className="h-4 w-16" />
    case 'actions':
      return line.contextMenu.type === 'single' ? (
        <BaseAccountItem.ContextMenu
          address={line.contextMenu.address}
          chainId={line.contextMenu.chainId}
          name={line.contextMenu.name}
          isReplayable={line.contextMenu.addNetwork}
          undeployedSafe={line.contextMenu.undeployedSafe}
          hideNestedSafes
          onClose={undefined}
        />
      ) : (
        <MultiAccountContextMenu
          name={line.contextMenu.name}
          address={line.contextMenu.address}
          chainIds={line.contextMenu.chainIds}
          addNetwork={line.contextMenu.addNetwork}
        />
      )
    default:
      return null
  }
}

const RowCell = ({
  column,
  line,
  isFirstCell,
  reorderable,
  nameCell,
  checkbox,
  onSelectToggle,
  renderActions,
  dragHandleProps,
  isDragging,
}: {
  column: SafeAccountColumn
  line: AccountLine
  isFirstCell: boolean
  reorderable: boolean
  nameCell: ReactNode
  checkbox?: RowCheckbox
  onSelectToggle?: (next: boolean) => void
  renderActions?: (line: AccountLine) => ReactNode
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  isDragging?: boolean
}) => {
  // The draggable parent's first cell hosts the (absolutely-positioned) grip — the Name cell normally,
  // or the leading checkbox cell in selection mode, so the grip sits left of the checkbox instead of
  // over it. It anchors to the cell, which must let the grip overflow into the left gutter without clipping.
  const hostsHandle = isFirstCell && dragHandleProps != null

  return (
    <TableCell
      data-testid={`account-cell-${column.id}`}
      sx={{
        textAlign: column.align ?? 'left',
        verticalAlign: 'middle',
        overflow: hostsHandle ? 'visible' : 'hidden',
        ...(hostsHandle ? { position: 'relative' } : {}),
        // Slimmer than MUI's default 16px so the fixed column budget matches the design.
        px: 1,
        // Horizontal inset for the hover pill on the outer cells (vertical inset + background-clip are set
        // at the Table level, where they can beat the theme's cell-border override).
        '&:first-of-type': { pl: 2, borderLeft: '4px solid transparent' },
        '&:last-of-type': { pr: 2, borderRight: '4px solid transparent' },
        ...(reorderable && column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : {}),
      }}
      onClick={column.id === 'actions' || column.id === 'select' ? (e) => e.stopPropagation() : undefined}
    >
      {hostsHandle && (
        <ReorderHandle dragHandleProps={dragHandleProps} isDragging={isDragging} inline={column.id === 'select'} />
      )}
      {column.id === 'select' ? (
        <SelectCell checkbox={checkbox} onSelectToggle={onSelectToggle} />
      ) : column.id === 'name' ? (
        nameCell
      ) : (
        <div
          className={cn(
            'flex items-center',
            column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start',
          )}
        >
          {column.id === 'actions' && renderActions ? renderActions(line) : <CellContent column={column} line={line} />}
        </div>
      )}
    </TableCell>
  )
}

const SafeAccountTableRow = ({
  line,
  columns,
  expanded,
  showDivider,
  isFlagged,
  highlighted,
  renderActions,
  onRename,
  checkbox,
  onSelectToggle,
  onToggle,
  onLinkClick,
  dragHandleProps,
  rowRef,
  rowDraggableProps,
  isDragging,
  onOverviewsLoaded,
}: SafeAccountTableRowProps) => {
  const router = useRouter()

  // A group parent covers its per-chain safes, a single/child its own. Children don't fetch — the
  // parent already loaded them (enabled = variant !== 'child').
  const rowSafes = useMemo<SafeItem[]>(
    () => (line.variant === 'group' ? (line.networks ?? []) : [line.source as SafeItem]),
    [line],
  )
  const observerRef = useRowOverviews(rowSafes, line.variant !== 'child', onOverviewsLoaded)
  // Compose the visibility observer ref with the drag-and-drop ref (only set in reorder mode).
  const setRowRef = useForkRef(observerRef, rowRef)

  // In selection mode a leaf row is one big checkbox — clicking anywhere on it toggles selection
  // (except affordances that stop propagation: the checkbox, actions, copy and explorer link).
  const rowSelectable = Boolean(checkbox) && !line.expandable && !checkbox?.disabled

  // Outside selection mode the whole row is a click target: leaf rows navigate to the safe, group rows
  // toggle their per-chain children. The name keeps its real <a> (for keyboard focus and modifier-clicks
  // that open a new tab) and the other affordances — copy, explorer, rename, the actions menu — keep
  // their own behaviour, so the row handler bails when the click lands on any of them.
  const rowNavigable = !checkbox && (line.expandable || line.href != null)

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) return
    if (line.expandable) onToggle?.()
    else if (line.href != null) {
      onLinkClick?.(line)
      router.push(line.href)
    }
  }

  // In reorder mode the row can be lifted to `position: fixed`, detaching it from the table's
  // fixed layout — pin each cell's width so the floating row keeps its column alignment.
  const reorderable = Boolean(rowDraggableProps)

  const nameCell = (
    <NameCell
      line={line}
      expanded={expanded}
      isFlagged={isFlagged}
      // Per-chain child rows can't be renamed on their own — only the whole safe (single/group).
      onRename={onRename && line.variant !== 'child' ? () => onRename(line) : undefined}
      disableLink={Boolean(checkbox)}
      onToggle={onToggle}
      onLinkClick={onLinkClick ? () => onLinkClick(line) : undefined}
    />
  )

  const rowEl = (
    <TableRow
      ref={setRowRef}
      {...rowDraggableProps}
      data-testid="account-table-row"
      data-variant={line.variant}
      // Locked rows opt out of the table's grey row hover (see the Table sx override).
      data-disabled={checkbox?.disabledReason ? '' : undefined}
      // Draws the row separator (via the Table sx override); false only at the last row of a group/list.
      data-divider={showDivider ? '' : undefined}
      // Marks a member of an address-poisoning similarity band. Every member (incl. the trusted anchor)
      // renders as its own rounded yellow-bordered card on the band; styling lives in the Table sx, keyed
      // off this attribute so it composes with the cell-level hover/separator machinery.
      data-highlighted={highlighted && !isDragging ? '' : undefined}
      // group/row lets the shared identity cell reveal its copy/explorer/rename icons on row hover.
      className="group/row"
      tabIndex={-1}
      onClick={rowSelectable ? () => onSelectToggle?.(!checkbox?.checked) : rowNavigable ? handleRowClick : undefined}
      sx={{
        ...(checkbox?.disabledReason ? { opacity: 0.55 } : {}),
        ...(rowSelectable || rowNavigable ? { cursor: 'pointer' } : {}),
        ...(isDragging ? { backgroundColor: 'background.paper', boxShadow: 3, borderRadius: '12px' } : {}),
      }}
    >
      {columns.map((column, index) => (
        <RowCell
          key={column.id}
          column={column}
          line={line}
          isFirstCell={index === 0}
          reorderable={reorderable}
          nameCell={nameCell}
          checkbox={checkbox}
          onSelectToggle={onSelectToggle}
          renderActions={renderActions}
          dragHandleProps={dragHandleProps}
          isDragging={isDragging}
        />
      ))}
    </TableRow>
  )

  // Locked rows (e.g. already in the workspace) explain themselves on hover over the whole row.
  if (checkbox?.disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger render={rowEl} />
        <TooltipContent>{checkbox.disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return rowEl
}

export default SafeAccountTableRow
