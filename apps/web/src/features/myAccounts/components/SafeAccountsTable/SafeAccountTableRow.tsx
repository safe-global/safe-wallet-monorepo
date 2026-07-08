import type { ReactNode } from 'react'
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import NextLink from 'next/link'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { Badge } from '@/components/ui/badge'
import { GripVertical, TriangleAlert } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import MultiAccountContextMenu from '@/components/common/SafeListContextMenu/MultiAccountContextMenu'
import { FiatBalance } from '@/features/spaces'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { cn } from '@/utils/cn'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import type { AccountLine } from './useSafeAccountRows'
import type { SafeAccountColumn } from './columns'
import { PendingBadge, ThresholdBadge } from '@/components/common/AccountBadges'
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
  /** Flags the row with a "High similarity" warning (address-poisoning defence). */
  isFlagged?: boolean
  /** Replaces the default context-menu actions cell (e.g. an "Add to workspace" button). */
  renderActions?: (line: AccountLine) => ReactNode
  /** When set, a leading checkbox cell is rendered in selection mode. */
  checkbox?: RowCheckbox
  onSelectToggle?: (nextChecked: boolean) => void
  /** Drop the name/address hover tooltips and copy affordance (for surfaces that show the full text). */
  plainCells?: boolean
  /** Show a copy button and block-explorer link next to the address (as in account rows elsewhere). */
  showAddressActions?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
  /** Drag-and-drop wiring from @hello-pangea/dnd — set only in reorder mode. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  rowRef?: (element: HTMLElement | null) => void
  rowDraggableProps?: DraggableProvidedDraggableProps
  isDragging?: boolean
}

// Fixed identicon column so the name always starts at the same x position (as in the design).
const NameCellContent = ({
  line,
  isFlagged,
  plainCells,
  showAddressActions,
}: {
  line: AccountLine
  isFlagged?: boolean
  /** Drop the name/address hover tooltips and the copy affordance — for surfaces with room for the full text. */
  plainCells?: boolean
  /** Show a copy button and block-explorer link next to the address. */
  showAddressActions?: boolean
}) => {
  // Only single-chain rows resolve to one explorer link; multi-chain parents show the address alone.
  const chainConfig = useChain(line.chainId)
  const explorerLink =
    showAddressActions && line.variant !== 'group' && chainConfig
      ? getBlockExplorerLink(chainConfig, line.address)
      : undefined

  return (
    <div className={cn('flex min-w-0 items-center gap-3', line.indent && 'pl-9')}>
      <span className="flex w-10 shrink-0 items-center">
        {line.variant === 'child' ? (
          <BaseAccountItem.Icon
            address={line.address}
            chainId={line.chainId}
            threshold={line.threshold}
            owners={line.owners}
            isMultiChainItem
          />
        ) : (
          <Identicon address={line.address} />
        )}
      </span>

      <div className="flex min-w-0 flex-col gap-0.5">
        {isFlagged && (
          <Badge variant="warning" className="-ml-px self-start">
            <TriangleAlert data-icon="inline-start" />
            High similarity
          </Badge>
        )}
        {plainCells ? (
          <Typography variant="paragraph-medium" className="text-foreground block truncate">
            {line.displayName}
          </Typography>
        ) : (
          <Tooltip>
            <TooltipTrigger render={<span />} className="block min-w-0 max-w-full">
              <Typography variant="paragraph-medium" className="text-foreground block truncate">
                {line.displayName}
              </Typography>
            </TooltipTrigger>
            <TooltipContent>{line.displayName}</TooltipContent>
          </Tooltip>
        )}
        {line.showAddress && (
          <AddressWithCopy
            address={line.address}
            full
            showCopy={showAddressActions || !plainCells}
            explorerLink={explorerLink}
          />
        )}
      </div>
    </div>
  )
}

const NameCell = ({
  line,
  expanded,
  isFlagged,
  plainCells,
  showAddressActions,
  disableLink,
  onToggle,
  onLinkClick,
}: {
  line: AccountLine
  expanded?: boolean
  isFlagged?: boolean
  plainCells?: boolean
  showAddressActions?: boolean
  /** In selection mode the row itself toggles the checkbox, so the name never navigates. */
  disableLink?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
}) => {
  const content = (
    <NameCellContent
      line={line}
      isFlagged={isFlagged}
      plainCells={plainCells}
      showAddressActions={showAddressActions}
    />
  )

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

const ReorderHandle = ({
  dragHandleProps,
  className,
}: {
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  className?: string
}) => (
  <span
    {...dragHandleProps}
    data-testid="account-drag-handle"
    aria-label="Drag to reorder"
    className={cn(
      'text-muted-foreground hover:text-foreground flex cursor-grab items-center justify-center active:cursor-grabbing',
      className,
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
    case 'pending':
      return <PendingBadge count={line.pending} loading={!line.dataLoaded} />
    case 'balance':
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
  showDivider,
  reorderable,
  nameCell,
  checkbox,
  onSelectToggle,
  renderActions,
  dragHandleProps,
}: {
  column: SafeAccountColumn
  line: AccountLine
  showDivider?: boolean
  reorderable: boolean
  nameCell: ReactNode
  checkbox?: RowCheckbox
  onSelectToggle?: (next: boolean) => void
  renderActions?: (line: AccountLine) => ReactNode
  dragHandleProps?: DraggableProvidedDragHandleProps | null
}) => (
  <TableCell
    data-testid={`account-cell-${column.id}`}
    sx={{
      textAlign: column.align ?? 'left',
      verticalAlign: 'middle',
      overflow: 'hidden',
      // Slimmer than MUI's default 16px so the fixed column budget matches the design.
      px: 1,
      '&:first-of-type': { pl: 2 },
      '&:last-of-type': { pr: 2 },
      borderBottom: showDivider ? '1px solid' : 'none',
      borderColor: 'divider',
      ...(reorderable && column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : {}),
    }}
    onClick={column.id === 'actions' || column.id === 'select' ? (e) => e.stopPropagation() : undefined}
  >
    {column.id === 'select' ? (
      <SelectCell checkbox={checkbox} onSelectToggle={onSelectToggle} />
    ) : column.id === 'name' ? (
      // Reorder mode: the grip shares the Name cell's left gutter and pushes the row content
      // right a little, so no extra column is added and the table keeps its width (no scrollbar).
      reorderable ? (
        <div className="flex min-w-0 items-center gap-2">
          <ReorderHandle dragHandleProps={dragHandleProps} className="relative z-10 shrink-0" />
          <div className="min-w-0 flex-1">{nameCell}</div>
        </div>
      ) : (
        nameCell
      )
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

const SafeAccountTableRow = ({
  line,
  columns,
  expanded,
  showDivider,
  isFlagged,
  renderActions,
  checkbox,
  onSelectToggle,
  plainCells,
  showAddressActions,
  onToggle,
  onLinkClick,
  dragHandleProps,
  rowRef,
  rowDraggableProps,
  isDragging,
}: SafeAccountTableRowProps) => {
  // In selection mode a leaf row is one big checkbox — clicking anywhere on it toggles selection
  // (except affordances that stop propagation: the checkbox, actions, copy and explorer link).
  const rowSelectable = Boolean(checkbox) && !line.expandable && !checkbox?.disabled

  // In reorder mode the row can be lifted to `position: fixed`, detaching it from the table's
  // fixed layout — pin each cell's width so the floating row keeps its column alignment.
  const reorderable = Boolean(rowDraggableProps)

  const nameCell = (
    <NameCell
      line={line}
      expanded={expanded}
      isFlagged={isFlagged}
      plainCells={plainCells}
      showAddressActions={showAddressActions}
      disableLink={Boolean(checkbox)}
      onToggle={onToggle}
      onLinkClick={onLinkClick}
    />
  )

  const rowEl = (
    <TableRow
      ref={rowRef}
      {...rowDraggableProps}
      data-testid="account-table-row"
      data-variant={line.variant}
      tabIndex={-1}
      onClick={rowSelectable ? () => onSelectToggle?.(!checkbox?.checked) : undefined}
      sx={{
        ...(checkbox?.disabledReason ? { opacity: 0.55 } : {}),
        ...(rowSelectable ? { cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } } : {}),
        ...(isDragging ? { backgroundColor: 'background.paper', boxShadow: 3, borderRadius: '12px' } : {}),
      }}
    >
      {columns.map((column) => (
        <RowCell
          key={column.id}
          column={column}
          line={line}
          showDivider={showDivider}
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
