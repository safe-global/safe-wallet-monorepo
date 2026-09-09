import { useCallback, useMemo, type MouseEvent, type ReactNode } from 'react'
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import type { LinkProps } from 'next/link'
import { useRouter } from 'next/router'
import { TableCell, TableRow } from '@/components/ui/table'
import type { SafeItem } from '@/hooks/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useRowOverviews } from './useRowOverviews'
import { GripVertical } from 'lucide-react'
import { SimilarityWarningIcon } from './SimilarityBand'
import type { SimilarWarning } from '@/features/address-poisoning'
import Identicon from '@/components/common/Identicon'
import { SafeInfoDisplay } from '@/components/common/AccountRow'
import MultiAccountContextMenu from '@/components/common/SafeListContextMenu/MultiAccountContextMenu'
import FiatBalance from '@/components/common/FiatBalance'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useChain } from '@/hooks/useChains'
import { useAddressBookWriteScope } from '@/features/spaces'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { cn } from '@/utils/cn'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import { NetworkLogosPill } from '@/features/multichain'
import { getContextMenuChainIds, type AccountLine } from './useSafeAccountRows'
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
  /** When set, shows the inline look-alike ⚠️ (with a peers tooltip) after the name — cross-list only. */
  warning?: SimilarWarning
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

// Single/parent rows lead with the identicon; child rows use a blank icon-width spacer to align under the parent.
const NameCellContent = ({
  line,
  warning,
  onRename,
  nameLink,
}: {
  line: AccountLine
  warning?: SimilarWarning
  onRename?: () => void
  /** When set, only the name text becomes a navigation link — see SafeInfoDisplay's `nameLink`. */
  nameLink?: { href: LinkProps['href']; onClick?: () => void; testId?: string }
}) => {
  const chainConfig = useChain(line.chainId)
  const { canRename } = useAddressBookWriteScope(line.address, getContextMenuChainIds(line.contextMenu))
  // Explorer links are per-chain: single safes and child rows get one, never the multi-chain parent
  // (whose chainId is just the first network's).
  const explorerLink =
    line.variant !== 'group' && chainConfig ? getBlockExplorerLink(chainConfig, line.address) : undefined

  const leading = line.variant === 'child' ? null : <Identicon address={line.address} />

  return (
    <SafeInfoDisplay
      name={line.displayName}
      address={line.address}
      leading={<span className="flex w-10 items-center">{leading}</span>}
      hideAddress={!line.showAddress}
      explorerLink={explorerLink}
      onRename={canRename ? onRename : undefined}
      nameAdornment={warning ? <SimilarityWarningIcon warning={warning} /> : undefined}
      nameVariant="paragraph-bold"
      className="min-w-0"
      nameLink={nameLink}
    />
  )
}

const NameCell = ({
  line,
  expanded,
  warning,
  disableLink,
  onToggle,
  onLinkClick,
  onRename,
}: {
  line: AccountLine
  expanded?: boolean
  warning?: SimilarWarning
  /** In selection mode the row itself toggles the checkbox, so the name never navigates. */
  disableLink?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
  onRename?: () => void
}) => {
  // Only the name text links, keeping the row's controls outside it (a nested <a> is invalid HTML).
  // Expandable rows render in a <button> so never link (<a> in <button> is invalid too); in selection
  // mode (disableLink) the whole row toggles the checkbox instead.
  const nameLink =
    line.href && !line.expandable && !disableLink
      ? { href: line.href, onClick: onLinkClick, testId: 'account-row-link' }
      : undefined

  const content = <NameCellContent line={line} warning={warning} onRename={onRename} nameLink={nameLink} />

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

  return content
}

// Absolutely positioned so the grip reserves no layout space. `inline` (narrow) sits in the checkbox
// cell on selection surfaces; `default` (wider) in the Name cell's left padding elsewhere.
const ReorderHandle = ({
  dragHandleProps,
  inline,
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  inline?: boolean
}) => (
  <span
    {...dragHandleProps}
    data-testid="account-drag-handle"
    aria-label="Drag to reorder"
    className={cn(
      'text-muted-foreground hover:text-foreground absolute inset-y-0 flex cursor-grab items-center justify-center active:cursor-grabbing',
      inline ? 'left-0 w-4' : 'left-0 w-7',
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
      return (
        <NetworkLogosPill>
          {line.networks ? (
            <BaseAccountItem.ChainBadge safes={line.networks} />
          ) : (
            <BaseAccountItem.ChainBadge chainId={line.chainId} />
          )}
        </NetworkLogosPill>
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
}) => {
  // The first cell hosts the grip and must let it overflow into the left gutter without clipping.
  const hostsHandle = isFirstCell && dragHandleProps != null

  return (
    <TableCell
      data-testid={`account-cell-${column.id}`}
      // Avatar-clears-grip padding lives in the panel variant's `td:first-of-type` rule (outranks a utility class).
      data-hosts-handle={hostsHandle && column.id !== 'select' ? '' : undefined}
      // Outer-cell padding and hover-pill borders live in the panel variant — they need background-clip
      // and specificity the primitive's classes can't beat.
      className={cn(hostsHandle ? 'relative overflow-visible' : 'overflow-hidden')}
      style={{
        textAlign: column.align ?? 'left',
        ...(reorderable && column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : {}),
      }}
      onClick={column.id === 'actions' || column.id === 'select' ? (e) => e.stopPropagation() : undefined}
    >
      {hostsHandle && <ReorderHandle dragHandleProps={dragHandleProps} inline={column.id === 'select'} />}
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
  warning,
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

  // A group parent covers its per-chain safes, a single/child its own; children don't fetch (the parent did).
  const rowSafes = useMemo<SafeItem[]>(
    () => (line.variant === 'group' ? (line.networks ?? []) : [line.source as SafeItem]),
    [line],
  )
  const observerRef = useRowOverviews(rowSafes, line.variant !== 'child', onOverviewsLoaded)
  // Compose the visibility observer ref (an object ref) with the drag-and-drop callback ref.
  const setRowRef = useCallback(
    (element: HTMLTableRowElement | null) => {
      observerRef.current = element
      if (typeof rowRef === 'function') rowRef(element)
    },
    [observerRef, rowRef],
  )

  // In selection mode a leaf row is one big checkbox; affordances that stop propagation are exempt.
  const rowSelectable = Boolean(checkbox) && !line.expandable && !checkbox?.disabled

  // Otherwise the whole row is a click target (leaf navigates, group toggles). The name keeps its real
  // <a> for keyboard focus and modifier-click, so the row handler bails on clicks landing on an affordance.
  const rowNavigable = !checkbox && (line.expandable || line.href != null)

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button, [role="button"]')) return
    if (line.expandable) onToggle?.()
    else if (line.href != null) {
      onLinkClick?.(line)
      router.push(line.href)
    }
  }

  // A reordered row is lifted to `position: fixed`, detaching it from the table layout — pin each cell's
  // width so the floating row keeps its column alignment.
  const reorderable = Boolean(rowDraggableProps)

  const nameCell = (
    <NameCell
      line={line}
      expanded={expanded}
      warning={warning}
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
      // The variant draws a separator under every row but the last; suppress inside a group or band (both self-close).
      data-no-divider={!showDivider || highlighted ? '' : undefined}
      // Band membership marker — the card styling is keyed off this attribute.
      data-highlighted={highlighted && !isDragging ? '' : undefined}
      // The band fill is the row's own; opt out of the shared hover pill so it isn't painted over.
      data-no-hover={highlighted ? '' : undefined}
      // group/row lets the shared identity cell reveal its copy/explorer/rename icons on row hover.
      className={cn(
        'group/row',
        checkbox?.disabledReason && 'opacity-[0.55]',
        (rowSelectable || rowNavigable) && 'cursor-pointer',
        isDragging && 'rounded-xl bg-[var(--color-background-paper)] shadow-md',
      )}
      tabIndex={-1}
      onClick={rowSelectable ? () => onSelectToggle?.(!checkbox?.checked) : rowNavigable ? handleRowClick : undefined}
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
