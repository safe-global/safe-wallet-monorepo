import { Fragment, type MouseEvent, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Clock, Coins, Lock, Sprout } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import { CHAIN_IDS, IDLE_CASH } from '../opportunities'
import { budgetLeft, depositRoute } from '../shelf'
import type { Holding, Operation, Opportunity, Sort, SortKey } from '../types'
import { GroupBand, TableCard } from './GroupedTable'

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

export type Selection = { selected: string[]; isFull: boolean; onToggle: (id: string) => void }

export type OpportunityGroup = { key: string; title?: string; showColumns?: boolean; items: Opportunity[] }

const BAND_COLUMNS = HEADERS.slice(1, -1).map(({ label }) => label)

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

const SelectMark = ({
  opportunity,
  invested,
  selection,
}: {
  opportunity: Opportunity
  invested: boolean
  selection: Selection
}) => {
  const checked = selection.selected.includes(opportunity.id)
  const always = selection.selected.length > 0
  return (
    <span className="relative flex size-8 shrink-0">
      <span
        className={cn(
          'transition-opacity',
          always ? 'opacity-0' : 'group-hover/row:opacity-0 group-has-[:focus-visible]/row:opacity-0',
        )}
      >
        <OpportunityMark invested={invested} />
      </span>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          always ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100 focus-within:opacity-100',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox
          checked={checked}
          disabled={!checked && selection.isFull}
          onCheckedChange={() => selection.onToggle(opportunity.id)}
          aria-label={DEFI_V1_COPY.compare.select(opportunity.name)}
        />
      </span>
    </span>
  )
}

/** A badge only when someone needs to act: unsigned deposits first, then a budget that can't cover the next top-up. */
const alertFor = (holding?: Holding, operation?: Operation): { label: string; detail: string } | undefined => {
  if (holding && holding.pending > 0)
    return {
      label: OPS.alerts.needsSignatures,
      detail: OPS.alerts.needsSignaturesDetail(formatCompactUsd(holding.pending)),
    }
  if (!operation) return undefined
  const left = budgetLeft(operation)
  if (left === 0) return { label: OPS.alerts.budgetUsed, detail: OPS.alerts.budgetUsedDetail }
  if (operation.recurring && left < operation.recurring.amount)
    return { label: OPS.alerts.budgetLow, detail: OPS.budgetLeft(formatCompactUsd(left)) }
  return undefined
}

const NameCell = ({
  opportunity,
  operation,
  holding,
  selection,
}: {
  opportunity: Opportunity
  operation?: Operation
  holding?: Holding
  selection: Selection
}) => {
  const alert = alertFor(holding, operation)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SelectMark opportunity={opportunity} invested={Boolean(holding)} selection={selection} />
      <div className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-foreground">{opportunity.name}</span>
          {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
          {alert && (
            <Tooltip delay={150}>
              <TooltipTrigger render={<span className="flex shrink-0" />}>
                <Badge variant="warning">{alert.label}</Badge>
              </TooltipTrigger>
              <TooltipContent>{alert.detail}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{opportunity.asset}</span>
          {' · '}
          {[
            opportunity.runBy,
            opportunity.curator,
            opportunity.kyc && 'KYC',
            operation?.recurring &&
              OPS.addsEvery(formatCompactUsd(operation.recurring.amount), OPS.cadence[operation.recurring.frequency]),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </div>
  )
}

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

const PositionCell = ({ holding }: { holding?: Holding }) => {
  if (!holding) return <Empty />
  return (
    <span className="flex min-w-0 flex-col gap-0.5 tabular-nums">
      {holding.invested > 0 && (
        <span className="flex items-center gap-2">
          <span className="font-semibold">{formatCompactUsd(holding.invested)}</span>
          {holding.earned > 0 && (
            <Tooltip delay={150}>
              <TooltipTrigger render={<span className="flex" />}>
                <Badge variant="brand">+{formatCompactUsd(holding.earned)}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                {DEFI_V1_COPY.positions.earnedReturn(formatApy(holding.earned / Math.max(holding.invested, 1)))}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      )}
      {holding.pending > 0 && (
        <span className="truncate text-xs text-muted-foreground">
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
  selection,
}: {
  opportunity: Opportunity
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onInvest?: (item: Opportunity) => void
  holding?: Holding
  heldIn?: Operation
  selection: Selection
}) => {
  const locked = isLocked(opportunity)
  const type = DEFI_V1_COPY.assetType[opportunity.type]
  return (
    <TableRow
      className={cn('group/row cursor-pointer', locked && 'opacity-70')}
      onClick={() => onSelect(opportunity)}
      data-testid={`opportunity-${opportunity.id}`}
    >
      <TableCell>
        <NameCell opportunity={opportunity} operation={heldIn} holding={holding} selection={selection} />
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
        <PositionCell holding={holding} />
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
  selection,
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
  selection: Selection
}) => {
  const isEmpty = groups.every((group) => group.items.length === 0)
  return (
    <TableCard label={label} widths={COLUMN_WIDTHS} className="min-w-[992px]">
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
              <GroupBand
                title={group.title}
                count={group.items.length}
                columnCount={COLUMN_COUNT}
                columns={group.showColumns ? BAND_COLUMNS : undefined}
              />
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
                selection={selection}
              />
            ))}
          </Fragment>
        ))}
      </TableBody>
    </TableCard>
  )
}
