import { Fragment, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  HandCoins,
  Landmark,
  Layers,
  Lock,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import { CHAIN_IDS } from '../opportunities'
import { budgetLeft } from '../shelf'
import { TransactionsLink } from './TransactionsLink'
import type { AssetType, Holding, Operation, Opportunity, Sort, SortKey } from '../types'

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

export type Selection = { selected: string[]; isFull: boolean; onToggle: (id: string) => void }

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

/** The protocol's logo, or its initials; with no opportunity yet it shows a neutral sprout. */
export const OpportunityMark = ({
  opportunity,
  invested = false,
}: {
  opportunity?: Opportunity
  invested?: boolean
}) => {
  if (!opportunity)
    return (
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-hidden
      >
        <Sprout className="size-4" />
      </span>
    )
  return (
    <Avatar size="sm" className="rounded-md" aria-hidden>
      {opportunity.logo && <AvatarImage src={opportunity.logo} alt="" className="rounded-md" />}
      <AvatarFallback className="rounded-md text-xs font-semibold">{opportunity.mark}</AvatarFallback>
      {invested && <AvatarBadge className="bg-badge-dot-success ring-card" />}
    </Avatar>
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
        <OpportunityMark opportunity={opportunity} invested={invested} />
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
export const alertFor = (holding?: Holding, operation?: Operation): { label: string; detail: string } | undefined => {
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

const CLASS_STYLE: Record<AssetType, { icon: LucideIcon; variant: 'info' | 'mint' | 'outline' }> = {
  rwa: { icon: Landmark, variant: 'info' },
  lending: { icon: HandCoins, variant: 'outline' },
  staking: { icon: Layers, variant: 'mint' },
}

export const ClassBadge = ({ type }: { type: AssetType }) => {
  const { icon: Icon, variant } = CLASS_STYLE[type]
  const { label, hint } = DEFI_V1_COPY.assetType[type]
  return (
    <Tooltip delay={150}>
      <TooltipTrigger render={<span className="flex w-fit shrink-0" onClick={(event) => event.stopPropagation()} />}>
        <Badge variant={variant} data-testid={`class-${type}`}>
          <Icon data-icon="inline-start" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** Paid placement has to be disclosed; the tooltip says what it means. */
export const SponsoredBadge = () => (
  <Tooltip delay={150}>
    <TooltipTrigger render={<span className="flex shrink-0" onClick={(event) => event.stopPropagation()} />}>
      <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>
    </TooltipTrigger>
    <TooltipContent className="max-w-64">{DEFI_V1_COPY.sponsoredHint}</TooltipContent>
  </Tooltip>
)

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
          {opportunity.placement === 'sponsored' && <SponsoredBadge />}
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

export const ExitCell = ({ opportunity }: { opportunity: Opportunity }) => (
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

export const NetworkLogos = ({ chains }: { chains: string[] }) => (
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

export const PositionCell = ({ holding, safes }: { holding?: Holding; safes?: string[] }) => {
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
        <span className="flex min-w-0 flex-col items-start text-xs text-muted-foreground">
          <span className="truncate">{DEFI_V1_COPY.positions.pendingAmount(formatCompactUsd(holding.pending))}</span>
          <TransactionsLink />
        </span>
      )}
      {safes && safes.length > 0 && (
        <span className="truncate text-xs text-muted-foreground">{DEFI_V1_COPY.workspace.inSafes(safes)}</span>
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
  onDeposit,
  holding,
  safes,
  heldIn,
  selection,
}: {
  opportunity: Opportunity
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onDeposit: (item: Opportunity) => void
  holding?: Holding
  safes?: string[]
  heldIn?: Operation
  selection: Selection
}) => {
  const locked = isLocked(opportunity)
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
        <ClassBadge type={opportunity.type} />
      </TableCell>
      <TableCell>
        <ExitCell opportunity={opportunity} />
      </TableCell>
      <TableCell>
        <NetworkLogos chains={opportunity.chains} />
      </TableCell>
      <TableCell>
        <PositionCell holding={holding} safes={safes} />
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
        ) : (
          <Button
            variant="outline"
            size="xs"
            onClick={stop(() => onDeposit(opportunity))}
            data-testid={`deposit-${opportunity.id}`}
          >
            {DEFI_V1_COPY.action.deposit}
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
  onDeposit,
  safesOf,
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
  onDeposit: (item: Opportunity) => void
  safesOf?: (item: Opportunity) => string[]
  sort: Sort | null
  onSort: (key: SortKey) => void
  holdingOf: (item: Opportunity) => Holding | undefined
  heldInOf: (item: Opportunity) => Operation | undefined
  selection: Selection
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
                onDeposit={onDeposit}
                holding={holdingOf(item)}
                safes={safesOf?.(item)}
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
