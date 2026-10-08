import type { MouseEvent, ReactNode } from 'react'
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { TableCell, TableRow } from '@/components/ui/table'
import { GripVertical } from 'lucide-react'
import NotActivatedBadge from '@/components/common/NotActivatedBadge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import type { AccountLine } from '@/features/myAccounts/components/SafeAccountsTable/useSafeAccountRows'
import type { SafeAccountColumn } from '@views/features/myAccounts/components/SafeAccountsTable/columns'
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

export type SafeInfoDisplaySlotProps = {
  leading: ReactNode
  nameAdornment: ReactNode
  nameVariant: 'paragraph-bold'
  className: string
}

export type SafeAccountNameContentViewProps = {
  /** Blockie identicon for single/parent rows; null keeps an empty spacer on per-chain child rows. */
  identicon: ReactNode
  warningIcon?: ReactNode
  renderSafeInfoDisplay: (props: SafeInfoDisplaySlotProps) => ReactNode
}

export const SafeAccountNameContentView = ({
  identicon,
  warningIcon,
  renderSafeInfoDisplay,
}: SafeAccountNameContentViewProps) => {
  return (
    <>
      {renderSafeInfoDisplay({
        leading: <span className="flex w-10 items-center">{identicon}</span>,
        nameAdornment: warningIcon,
        nameVariant: 'paragraph-bold',
        className: 'min-w-0',
      })}
    </>
  )
}

export type SafeAccountNameCellViewProps = {
  expandable: boolean
  expanded?: boolean
  onToggle?: () => void
  content: ReactNode
}

export const SafeAccountNameCellView = ({ expandable, expanded, onToggle, content }: SafeAccountNameCellViewProps) => {
  if (expandable) {
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

  return <>{content}</>
}

// Always-visible grip, absolutely positioned so it reserves no layout space. Two placements:
//  • default: inside the Name cell's left padding (the cell widens via `pl` while reordering, shifting
//    the avatar right to make room — see the RowCell sx), used by the page lists.
//  • inline: sits in the leading checkbox cell's own left padding (selection surfaces like the Manage
//    list, whose table is inside a horizontally-clipping scroll container).
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

type CellSlots = {
  /** Network logos pill with the row's chain badge(s). */
  networksCell: ReactNode
  /** Fiat balance of a loaded, deployed row. */
  fiatBalance: ReactNode
  /** Default context-menu actions for the row. */
  contextMenu: ReactNode
}

const CellContent = ({
  column,
  line,
  networksCell,
  fiatBalance,
  contextMenu,
}: { column: SafeAccountColumn; line: AccountLine } & CellSlots): ReactNode => {
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
      return networksCell
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
      return line.dataLoaded ? fiatBalance : <Skeleton className="h-4 w-16" />
    case 'actions':
      return contextMenu
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
  nameOverflows,
  checkbox,
  onSelectToggle,
  renderActions,
  dragHandleProps,
  ...slots
}: {
  column: SafeAccountColumn
  line: AccountLine
  isFirstCell: boolean
  reorderable: boolean
  nameCell: ReactNode
  nameOverflows: boolean
  checkbox?: RowCheckbox
  onSelectToggle?: (next: boolean) => void
  renderActions?: (line: AccountLine) => ReactNode
  dragHandleProps?: DraggableProvidedDragHandleProps | null
} & CellSlots) => {
  // The draggable parent's first cell hosts the (absolutely-positioned) grip — the Name cell normally,
  // or the leading checkbox cell in selection mode, so the grip sits left of the checkbox instead of
  // over it. It anchors to the cell, which must let the grip overflow into the left gutter without clipping.
  const hostsHandle = isFirstCell && dragHandleProps != null

  return (
    <TableCell
      data-testid={`account-cell-${column.id}`}
      // The Name cell hosts the always-visible grip (w-7, anchored left-0), so it needs extra left
      // padding for the avatar to start after the grip rather than under it. The selection cell's
      // grip is the narrower `inline` one and fits the default padding. Widening happens in
      // the panel variant — the `td:first-of-type` rule there outranks a utility class.
      data-hosts-handle={hostsHandle && column.id !== 'select' ? '' : undefined}
      // Slim 8px padding (ui default), 16px on the outer cells + the hover-pill inset borders live in
      // the panel variant (they need background-clip + specificity the primitive's classes can't beat).
      className={cn(
        hostsHandle ? 'relative overflow-visible' : 'overflow-hidden',
        nameOverflows && column.id === 'name' && 'overflow-visible',
      )}
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
          {column.id === 'actions' && renderActions ? (
            renderActions(line)
          ) : (
            <CellContent column={column} line={line} {...slots} />
          )}
        </div>
      )}
    </TableCell>
  )
}

export type SafeAccountTableRowViewProps = {
  line: AccountLine
  columns: SafeAccountColumn[]
  showDivider?: boolean
  highlighted?: boolean
  isDragging?: boolean
  checkbox?: RowCheckbox
  /** Whether the whole row is a click target (selection toggle or navigation). */
  clickable: boolean
  onRowClick?: (event: MouseEvent<HTMLElement>) => void
  rowRef: (element: HTMLTableRowElement | null) => void
  rowDraggableProps?: DraggableProvidedDraggableProps
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  reorderable: boolean
  nameCell: ReactNode
  nameOverflows: boolean
  onSelectToggle?: (nextChecked: boolean) => void
  renderActions?: (line: AccountLine) => ReactNode
} & CellSlots

export const SafeAccountTableRowView = ({
  line,
  columns,
  showDivider,
  highlighted,
  isDragging,
  checkbox,
  clickable,
  onRowClick,
  rowRef,
  rowDraggableProps,
  dragHandleProps,
  reorderable,
  nameCell,
  nameOverflows,
  onSelectToggle,
  renderActions,
  networksCell,
  fiatBalance,
  contextMenu,
}: SafeAccountTableRowViewProps) => {
  const rowEl = (
    <TableRow
      ref={rowRef}
      {...rowDraggableProps}
      data-testid="account-table-row"
      data-variant={line.variant}
      // Locked rows opt out of the table's grey row hover (see the Table sx override).
      data-disabled={checkbox?.disabledReason ? '' : undefined}
      // The variant draws a separator under every row but the last; suppress it inside a group and
      // inside a band, both of which close themselves.
      data-no-divider={!showDivider || highlighted ? '' : undefined}
      // Band membership marker — the card styling is keyed off this attribute.
      data-highlighted={highlighted && !isDragging ? '' : undefined}
      // The band fill is the row's own; opt out of the shared hover pill so it isn't painted over.
      data-no-hover={highlighted ? '' : undefined}
      // group/row lets the shared identity cell reveal its copy/explorer/rename icons on row hover;
      // the lifted-while-dragging chrome is here.
      className={cn(
        'group/row',
        checkbox?.disabledReason && 'opacity-[0.55]',
        clickable && 'cursor-pointer',
        isDragging && 'rounded-xl bg-[var(--color-background-paper)] shadow-md',
      )}
      tabIndex={-1}
      onClick={onRowClick}
    >
      {columns.map((column, index) => (
        <RowCell
          key={column.id}
          column={column}
          line={line}
          isFirstCell={index === 0}
          reorderable={reorderable}
          nameCell={nameCell}
          nameOverflows={nameOverflows}
          checkbox={checkbox}
          onSelectToggle={onSelectToggle}
          renderActions={renderActions}
          dragHandleProps={dragHandleProps}
          networksCell={networksCell}
          fiatBalance={fiatBalance}
          contextMenu={contextMenu}
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
