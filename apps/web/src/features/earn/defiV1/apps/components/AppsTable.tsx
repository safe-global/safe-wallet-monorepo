import { Fragment, type MouseEvent } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import BatchIcon from '@/public/images/apps/batch-icon.svg'
import { isOptimizedForBatchTransactions } from '@/components/safe-apps/utils'
import { GroupBand, TableCard } from '../../components/GroupedTable'
import type { AppGroup, AppRow } from '../catalogue'
import { APPS_V1_COPY } from '../copy'
import { AppBadge, AppIcon, NetworkLogos, PinButton } from './AppParts'

const COPY = APPS_V1_COPY
const COLUMN_WIDTHS = ['', 'w-[36%]', 'w-28', 'w-24', 'w-28']
const users = new Intl.NumberFormat('en-US')

const ColumnHeaders = () => (
  <TableHeader>
    <TableRow data-no-hover>
      <TableHead className="text-xs text-muted-foreground">{COPY.columns.app}</TableHead>
      <TableHead className="text-xs text-muted-foreground">{COPY.columns.does}</TableHead>
      <TableHead className="text-xs text-muted-foreground">{COPY.columns.networks}</TableHead>
      <TableHead className="text-xs text-muted-foreground">
        <Tooltip delay={150}>
          <TooltipTrigger render={<span className="inline-flex items-center gap-1" />}>
            {COPY.columns.users}
            <Info className="size-3.5" aria-hidden />
          </TooltipTrigger>
          <TooltipContent>{COPY.usersHint}</TooltipContent>
        </Tooltip>
      </TableHead>
      <TableHead>
        <span className="sr-only">Action</span>
      </TableHead>
    </TableRow>
  </TableHeader>
)

const AppRowView = ({
  row,
  pinned,
  onOpen,
  onTogglePin,
  chainName,
}: {
  row: AppRow
  pinned: boolean
  onOpen: (row: AppRow) => void
  onTogglePin?: () => void
  chainName: (chainId: string) => string
}) => (
  <TableRow className="group/row cursor-pointer" onClick={() => onOpen(row)} data-testid={`app-row-${row.id}`}>
    <TableCell>
      <div className="flex min-w-0 items-center gap-3">
        <AppIcon row={row} />
        <span className="truncate font-medium text-foreground">{row.name}</span>
        <AppBadge row={row} />
        {row.app && isOptimizedForBatchTransactions(row.app) && (
          <Tooltip delay={150}>
            <TooltipTrigger render={<span className="flex shrink-0" />}>
              <BatchIcon />
            </TooltipTrigger>
            <TooltipContent>Batch transactions</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TableCell>
    <TableCell className="truncate text-muted-foreground">{row.does}</TableCell>
    <TableCell>
      <NetworkLogos chainIds={row.chainIds} chainName={chainName} />
    </TableCell>
    <TableCell className="tabular-nums">
      {row.users ? users.format(row.users) : <span className="text-muted-foreground">—</span>}
    </TableCell>
    <TableCell>
      <div className="flex items-center justify-end gap-1">
        {onTogglePin && <PinButton row={row} pinned={pinned} onToggle={onTogglePin} />}
        <Button
          variant="outline"
          size="xs"
          onClick={(event: MouseEvent) => {
            event.stopPropagation()
            onOpen(row)
          }}
          data-testid={`open-${row.id}`}
        >
          {COPY.open}
        </Button>
      </div>
    </TableCell>
  </TableRow>
)

export const AppsTable = ({
  groups,
  isPinned,
  onOpen,
  onTogglePin,
  chainName,
}: {
  groups: AppGroup[]
  isPinned: (row: AppRow) => boolean
  onOpen: (row: AppRow) => void
  onTogglePin: (row: AppRow) => void
  chainName: (chainId: string) => string
}) => (
  <TableCard label={COPY.tableLabel} widths={COLUMN_WIDTHS} className="min-w-[880px]">
    <ColumnHeaders />
    <TableBody data-testid="apps-table">
      {groups.length === 0 && (
        <TableRow data-no-hover>
          <TableCell colSpan={COLUMN_WIDTHS.length} className="py-6 text-center text-muted-foreground">
            {COPY.noMatches}
          </TableCell>
        </TableRow>
      )}
      {groups.map((group) => (
        <Fragment key={group.key}>
          <GroupBand title={group.title} count={group.rows.length} columnCount={COLUMN_WIDTHS.length} />
          {group.rows.map((row) => (
            <AppRowView
              key={row.id}
              row={row}
              pinned={isPinned(row)}
              onOpen={onOpen}
              onTogglePin={row.app && !row.custom ? () => onTogglePin(row) : undefined}
              chainName={chainName}
            />
          ))}
        </Fragment>
      ))}
    </TableBody>
  </TableCard>
)
