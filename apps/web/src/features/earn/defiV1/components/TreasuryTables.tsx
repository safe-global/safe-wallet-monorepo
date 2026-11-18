import { Fragment, type MouseEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, Coins, Lock, Repeat, Sprout } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import { CHAIN_IDS, IDLE_CASH } from '../opportunities'
import { depositRoute } from '../shelf'
import type { Holding, Operation, Opportunity, Sort, SortKey } from '../types'

const BAND_CELL = 'bg-foreground/[0.03] py-0!'
const OPS = DEFI_V1_COPY.operations
const COLUMN_WIDTHS = ['', 'w-24', 'w-28', 'w-32', 'w-24', 'w-32 @6xl:w-44', 'w-40']
const COLUMN_COUNT = COLUMN_WIDTHS.length
const COLUMNS = DEFI_V1_COPY.columns
const HEADERS: { label: string; sortKey?: SortKey }[] = [
  { label: COLUMNS.name, sortKey: 'name' },
  { label: COLUMNS.apy, sortKey: 'apy' },
  { label: COLUMNS.type, sortKey: 'type' },
  { label: COLUMNS.exit, sortKey: 'exit' },
  { label: COLUMNS.networks },
  { label: COLUMNS.position, sortKey: 'position' },
]

export type OpportunityGroup = { key: string; title?: string; showColumns?: boolean; items: Opportunity[] }

const BAND_COLUMNS = HEADERS.slice(1, -1).map(({ label }) => label)
const BAND_LABEL = 'text-xs font-semibold uppercase text-muted-foreground'

const GroupBand = ({ title, count, showColumns }: { title: string; count: number; showColumns?: boolean }) => {
  const label = (
    <div className="flex min-h-10 items-center gap-2">
      <span className={showColumns ? BAND_LABEL : 'text-sm font-medium text-foreground'}>{title}</span>
      <Badge variant="subtle">{count}</Badge>
    </div>
  )
  if (!showColumns)
    return (
      <TableRow data-no-hover data-no-divider>
        <TableCell colSpan={COLUMN_COUNT} className={`rounded-lg ${BAND_CELL}`}>
          {label}
        </TableCell>
      </TableRow>
    )
  return (
    <TableRow data-no-hover data-no-divider>
      <TableCell className={`rounded-l-lg ${BAND_CELL}`}>{label}</TableCell>
      {BAND_COLUMNS.map((column) => (
        <TableCell key={column} className={cn(BAND_LABEL, BAND_CELL)}>
          {column}
        </TableCell>
      ))}
      <TableCell colSpan={COLUMN_COUNT - BAND_COLUMNS.length - 1} className={`rounded-r-lg ${BAND_CELL}`} />
    </TableRow>
  )
}

const SortIcon = ({ direction }: { direction?: Sort['direction'] }) => {
  const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown
  return <Icon className={cn('size-3.5', !direction && 'opacity-0 group-hover:opacity-100')} aria-hidden />
}

const ColumnHeaders = ({
  title,
  count,
  sort,
  onSort,
}: {
  title: string
  count?: number
  sort: Sort | null
  onSort: (key: SortKey) => void
}) => (
  <TableHeader>
    <TableRow data-no-hover>
      {HEADERS.map(({ label: column, sortKey }, index) => {
        const label = index === 0 ? title : column
        const direction = sortKey && sort?.key === sortKey ? sort.direction : undefined
        return (
          <TableHead
            key={label}
            className="text-xs text-muted-foreground"
            aria-sort={direction ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}
          >
            {sortKey ? (
              <button
                type="button"
                className={cn(
                  'group -mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground',
                  direction && 'text-foreground',
                )}
                onClick={() => onSort(sortKey)}
                aria-label={DEFI_V1_COPY.sortBy(label)}
              >
                {label}
                <SortIcon direction={direction} />
              </button>
            ) : (
              label
            )}
            {index === 0 && count !== undefined && (
              <Badge variant="subtle" className="ml-2">
                {count}
              </Badge>
            )}
          </TableHead>
        )
      })}
      <TableHead>
        <span className="sr-only">Action</span>
      </TableHead>
    </TableRow>
  </TableHeader>
)

// Mirrors the Tag in the pending queue prototype, which is not on dev yet.
export const Tag = ({ children, muted }: { children: ReactNode; muted?: boolean }) => (
  <span
    className={cn(
      'inline-flex h-6 w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-[6px] px-2 text-[13px] leading-5 font-medium [&>svg]:size-3.5 [&>svg]:shrink-0',
      muted ? 'text-muted-foreground' : 'bg-muted text-foreground',
    )}
  >
    {children}
  </span>
)

export const OpportunityMark = ({ invested = false }: { invested?: boolean }) => {
  const Icon = invested ? Coins : Sprout
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md',
        invested ? 'bg-success-tint text-badge-dot-success' : 'bg-muted text-muted-foreground',
      )}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  )
}

const NameCell = ({
  opportunity,
  operation,
  invested,
}: {
  opportunity: Opportunity
  operation?: Operation
  invested: boolean
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <OpportunityMark invested={invested} />
    <div className="flex min-w-0 flex-col">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-foreground">{opportunity.name}</span>
        {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
        {operation && (
          <Tooltip delay={150}>
            <TooltipTrigger render={<span className="flex shrink-0" />}>
              <Badge variant="success">{OPS.ofSigners(operation.threshold, operation.owners)}</Badge>
            </TooltipTrigger>
            <TooltipContent>{OPS.runsIn(operation.name)}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{opportunity.asset}</span>
        {' · '}
        {[opportunity.runBy, opportunity.curator, opportunity.kyc && 'KYC'].filter(Boolean).join(' · ')}
      </span>
    </div>
  </div>
)

const ExitCell = ({ opportunity }: { opportunity: Opportunity }) => (
  <Tooltip delay={150}>
    <TooltipTrigger render={<span className="flex min-w-0 items-center gap-1.5" />}>
      <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{opportunity.exitShort}</span>
    </TooltipTrigger>
    <TooltipContent>{opportunity.exitLabel}</TooltipContent>
  </Tooltip>
)

export const ChainLogo = ({ chain }: { chain: string }) => (
  <Avatar size="xs" className="size-4 ring-2 ring-card">
    {CHAIN_IDS[chain] && (
      <AvatarImage
        src={`https://safe-transaction-assets.safe.global/chains/${CHAIN_IDS[chain]}/chain_logo.png`}
        alt=""
      />
    )}
    <AvatarFallback className="text-[9px]">{chain[0]}</AvatarFallback>
  </Avatar>
)

const NetworkLogos = ({ chains }: { chains: string[] }) => (
  <Tooltip delay={150}>
    <TooltipTrigger render={<span className="flex shrink-0 -space-x-1" />}>
      {chains.map((chain) => (
        <ChainLogo key={chain} chain={chain} />
      ))}
    </TooltipTrigger>
    <TooltipContent>{chains.join(', ')}</TooltipContent>
  </Tooltip>
)

const Empty = () => <span className="text-muted-foreground">—</span>

const PositionCell = ({ holding, operation }: { holding?: Holding; operation?: Operation }) => {
  if (!holding) return <Empty />
  return (
    <span className="flex min-w-0 flex-col">
      {holding.invested > 0 && (
        <span className="flex flex-wrap items-center gap-x-2 tabular-nums">
          <span className="font-semibold">{formatCompactUsd(holding.invested)}</span>
          <span className="text-xs text-badge-dot-success">+{formatCompactUsd(holding.earned)}</span>
          {operation?.recurring && (
            <Tooltip delay={150}>
              <TooltipTrigger render={<span className="flex text-muted-foreground" />}>
                <Repeat className="size-3.5" aria-label={OPS.recurringLabel} />
              </TooltipTrigger>
              <TooltipContent>
                {OPS.recurring(
                  formatCompactUsd(operation.recurring.amount),
                  OPS.frequencies[operation.recurring.frequency],
                )}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      )}
      {holding.pending > 0 && (
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {DEFI_V1_COPY.positions.pendingAmount(formatCompactUsd(holding.pending))}
        </span>
      )}
    </span>
  )
}

const stop = (action: () => void) => (event: MouseEvent) => {
  event.stopPropagation()
  action()
}

const OpportunityRow = ({
  opportunity,
  isLocked,
  onSelect,
  onInvest,
  holding,
  heldIn,
}: {
  opportunity: Opportunity
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onInvest?: (item: Opportunity) => void
  holding?: Holding
  heldIn?: Operation
}) => {
  const locked = isLocked(opportunity)
  const type = DEFI_V1_COPY.assetType[opportunity.type]
  return (
    <TableRow
      className={cn('cursor-pointer', locked && 'opacity-70')}
      onClick={() => onSelect(opportunity)}
      data-testid={`opportunity-${opportunity.id}`}
    >
      <TableCell>
        <NameCell opportunity={opportunity} operation={heldIn} invested={Boolean(holding)} />
      </TableCell>
      <TableCell className="font-semibold tabular-nums">{formatApy(opportunity.apy)}</TableCell>
      <TableCell>
        <Tooltip delay={150}>
          <TooltipTrigger render={<span className="flex w-fit" />}>
            <Tag>{type.label}</Tag>
          </TooltipTrigger>
          <TooltipContent>{type.hint}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        <ExitCell opportunity={opportunity} />
      </TableCell>
      <TableCell>
        <NetworkLogos chains={opportunity.chains} />
      </TableCell>
      <TableCell>
        <PositionCell holding={holding} operation={heldIn} />
      </TableCell>
      <TableCell className="text-right">
        {locked ? (
          <Button variant="outline" size="xs" onClick={stop(() => onSelect(opportunity))}>
            <Lock />
            {DEFI_V1_COPY.proOnly}
          </Button>
        ) : holding ? (
          <Button
            variant="outline"
            size="xs"
            onClick={stop(() => onSelect(opportunity))}
            data-testid={`manage-${opportunity.id}`}
          >
            {DEFI_V1_COPY.manage}
          </Button>
        ) : onInvest ? (
          <Button
            variant="outline"
            size="xs"
            onClick={stop(() => onInvest(opportunity))}
            data-testid={`invest-${opportunity.id}`}
          >
            {DEFI_V1_COPY.operations.invest}
          </Button>
        ) : (
          <Button variant="outline" size="xs" onClick={stop(() => onSelect(opportunity))}>
            {DEFI_V1_COPY.action.rowLabel[depositRoute(opportunity, IDLE_CASH)]}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

const TableCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <Card radius="xl" size="none">
    <CardContent>
      <Table aria-label={label} variant="panel" className="table-fixed min-w-[992px] [&_td]:px-4 [&_th]:px-4">
        <colgroup>
          {COLUMN_WIDTHS.map((width, index) => (
            <col key={index} className={width || undefined} />
          ))}
        </colgroup>
        {children}
      </Table>
    </CardContent>
  </Card>
)

export const OpportunitiesTable = ({
  label,
  groups,
  isLocked,
  onSelect,
  onInvest,
  sort,
  onSort,
  holdingOf,
  heldInOf,
}: {
  label: string
  groups: OpportunityGroup[]
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onInvest?: (item: Opportunity) => void
  sort: Sort | null
  onSort: (key: SortKey) => void
  holdingOf: (item: Opportunity) => Holding | undefined
  heldInOf: (item: Opportunity) => Operation | undefined
}) => {
  const isEmpty = groups.every((group) => group.items.length === 0)
  return (
    <TableCard label={label}>
      <ColumnHeaders
        title={label}
        count={groups.length > 1 && !groups[0].title ? groups[0].items.length : undefined}
        sort={sort}
        onSort={onSort}
      />
      <TableBody data-testid="defi-opportunities">
        {isEmpty && (
          <TableRow data-no-hover>
            <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
              {DEFI_V1_COPY.noMatches}
            </TableCell>
          </TableRow>
        )}
        {groups.map((group) => (
          <Fragment key={group.key}>
            {group.title && (
              <GroupBand title={group.title} count={group.items.length} showColumns={group.showColumns} />
            )}
            {group.items.map((item) => (
              <OpportunityRow
                key={item.id}
                opportunity={item}
                isLocked={isLocked}
                onSelect={onSelect}
                onInvest={onInvest}
                holding={holdingOf(item)}
                heldIn={heldInOf(item)}
              />
            ))}
          </Fragment>
        ))}
      </TableBody>
    </TableCard>
  )
}
