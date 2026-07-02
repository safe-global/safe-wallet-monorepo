import type { ReactNode } from 'react'
import NextLink from 'next/link'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { Badge } from '@/components/ui/badge'
import { TriangleAlert } from 'lucide-react'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import MultiAccountContextMenu from '@/components/common/SafeListContextMenu/MultiAccountContextMenu'
import { FiatBalance } from '@/features/spaces'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/utils/cn'
import { AccountItem as BaseAccountItem } from '../AccountItem'
import type { AccountLine } from './useSafeAccountRows'
import type { SafeAccountColumn } from './columns'
import { PendingBadge, ThresholdBadge } from '@/components/common/AccountBadges'
import { WorkspaceAvatars } from './cells'

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
  onToggle?: () => void
  onLinkClick?: () => void
}

// Fixed identicon column so the name always starts at the same x position (as in the design).
const NameCellContent = ({ line, isFlagged }: { line: AccountLine; isFlagged?: boolean }) => (
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
      <Tooltip>
        <TooltipTrigger render={<span />} className="block min-w-0 max-w-full">
          <Typography variant="paragraph-medium" className="text-foreground block truncate">
            {line.displayName}
          </Typography>
        </TooltipTrigger>
        <TooltipContent>{line.displayName}</TooltipContent>
      </Tooltip>
      {line.showAddress && <AddressWithCopy address={line.address} full />}
    </div>
  </div>
)

const NameCell = ({
  line,
  expanded,
  isFlagged,
  onToggle,
  onLinkClick,
}: {
  line: AccountLine
  expanded?: boolean
  isFlagged?: boolean
  onToggle?: () => void
  onLinkClick?: () => void
}) => {
  if (line.expandable) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-testid="account-group-toggle"
        className="hover:bg-muted/40 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center rounded-lg px-2 py-1 text-left transition-colors"
      >
        <NameCellContent line={line} isFlagged={isFlagged} />
      </button>
    )
  }

  if (line.href) {
    return (
      <NextLink href={line.href} onClick={onLinkClick} data-testid="account-row-link" className="block">
        <NameCellContent line={line} isFlagged={isFlagged} />
      </NextLink>
    )
  }

  return <NameCellContent line={line} isFlagged={isFlagged} />
}

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

const SafeAccountTableRow = ({
  line,
  columns,
  expanded,
  showDivider,
  isFlagged,
  renderActions,
  onToggle,
  onLinkClick,
}: SafeAccountTableRowProps) => (
  <TableRow data-testid="account-table-row" data-variant={line.variant} tabIndex={-1}>
    {columns.map((column) => (
      <TableCell
        key={column.id}
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
        }}
        onClick={column.id === 'actions' ? (e) => e.stopPropagation() : undefined}
      >
        {column.id === 'name' ? (
          <NameCell
            line={line}
            expanded={expanded}
            isFlagged={isFlagged}
            onToggle={onToggle}
            onLinkClick={onLinkClick}
          />
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
              <CellContent column={column} line={line} />
            )}
          </div>
        )}
      </TableCell>
    ))}
  </TableRow>
)

export default SafeAccountTableRow
