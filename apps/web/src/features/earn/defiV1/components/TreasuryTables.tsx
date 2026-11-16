import { Fragment, type ReactNode } from 'react'
import { Clock, Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@safe-global/views/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd } from '../copy'
import { CHAIN_IDS } from '../opportunities'
import type { Holding, Opportunity } from '../types'

const BAND_CELL = 'bg-foreground/[0.03] py-0!'
const COLUMN_WIDTHS = ['w-10', '', 'w-20', 'w-24', 'w-32', 'w-28', 'w-28', 'w-28', 'w-24']
const COLUMN_COUNT = COLUMN_WIDTHS.length
const OPPORTUNITY_HEADERS = ['Opportunity', 'Asset', 'Net APY', 'Category', 'Exit time', 'Invested', 'Earned']

export type OpportunityGroup = { key: string; title?: string; items: Opportunity[] }

type Selection = { selected: string[]; isFull: boolean; onToggle: (id: string) => void }

const GroupBand = ({ title, count }: { title: string; count: number }) => (
  <TableRow data-no-hover data-no-divider>
    <TableCell colSpan={COLUMN_COUNT} className={`rounded-lg ${BAND_CELL}`}>
      <div className="flex min-h-10 items-center gap-2">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <Badge variant="subtle">{count}</Badge>
      </div>
    </TableCell>
  </TableRow>
)

const ColumnHeaders = ({ labels }: { labels: string[] }) => (
  <TableHeader>
    <TableRow data-no-hover>
      <TableHead />
      {labels.map((label) => (
        <TableHead key={label} className="text-xs text-muted-foreground">
          {label}
        </TableHead>
      ))}
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

export const OpportunityMark = ({ opportunity }: { opportunity: Opportunity }) => (
  <span
    className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background"
    aria-hidden
  >
    {opportunity.mark}
  </span>
)

const NameCell = ({ opportunity }: { opportunity: Opportunity }) => (
  <div className="flex min-w-0 items-center gap-3">
    <OpportunityMark opportunity={opportunity} />
    <div className="flex min-w-0 flex-col">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-foreground">{opportunity.name}</span>
        {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <NetworkLogos chains={opportunity.chains} />
        <span className="truncate">
          {[opportunity.runBy, opportunity.curator, opportunity.kyc && 'KYC'].filter(Boolean).join(' · ')}
        </span>
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

const InvestedCell = ({ holding }: { holding?: Holding }) => {
  if (!holding) return <Empty />
  return (
    <span className="flex min-w-0 flex-col">
      {holding.invested > 0 && <span className="font-semibold tabular-nums">{formatCompactUsd(holding.invested)}</span>}
      {holding.pending > 0 && (
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {DEFI_V1_COPY.positions.pendingAmount(formatCompactUsd(holding.pending))}
        </span>
      )}
    </span>
  )
}

const EarnedCell = ({ holding }: { holding?: Holding }) =>
  holding && holding.invested > 0 ? (
    <span className="font-medium tabular-nums">+{formatCompactUsd(holding.earned)}</span>
  ) : (
    <Empty />
  )

const OpportunityRow = ({
  opportunity,
  isLocked,
  onSelect,
  selection,
  holding,
}: {
  opportunity: Opportunity
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  selection: Selection
  holding?: Holding
}) => {
  const locked = isLocked(opportunity)
  const checked = selection.selected.includes(opportunity.id)
  return (
    <TableRow
      className={cn('cursor-pointer', locked && 'opacity-70')}
      onClick={() => onSelect(opportunity)}
      data-testid={`opportunity-${opportunity.id}`}
    >
      <TableCell onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={checked}
          disabled={!checked && selection.isFull}
          onCheckedChange={() => selection.onToggle(opportunity.id)}
          aria-label={`Compare ${opportunity.name}`}
        />
      </TableCell>
      <TableCell>
        <NameCell opportunity={opportunity} />
      </TableCell>
      <TableCell className="font-semibold">{opportunity.asset}</TableCell>
      <TableCell className="font-semibold tabular-nums">{formatApy(opportunity.apy)}</TableCell>
      <TableCell className="truncate">{DEFI_V1_COPY.category[opportunity.category].title}</TableCell>
      <TableCell>
        <ExitCell opportunity={opportunity} />
      </TableCell>
      <TableCell>
        <InvestedCell holding={holding} />
      </TableCell>
      <TableCell>
        <EarnedCell holding={holding} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="xs"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(opportunity)
          }}
        >
          {locked && <Lock />}
          {locked ? DEFI_V1_COPY.proOnly : DEFI_V1_COPY.factSheet.deposit}
        </Button>
      </TableCell>
    </TableRow>
  )
}

const TableCard = ({ label, children }: { label: string; children: ReactNode }) => (
  <Card radius="xl" size="none">
    <CardContent>
      <Table aria-label={label} variant="panel" className="table-fixed min-w-[1000px] [&_td]:px-4 [&_th]:px-4">
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
  groups,
  isLocked,
  onSelect,
  selection,
  holdingOf,
}: {
  groups: OpportunityGroup[]
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  selection: Selection
  holdingOf: (item: Opportunity) => Holding | undefined
}) => {
  const isEmpty = groups.every((group) => group.items.length === 0)
  return (
    <TableCard label="Opportunities">
      <ColumnHeaders labels={OPPORTUNITY_HEADERS} />
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
            {group.title && <GroupBand title={group.title} count={group.items.length} />}
            {group.items.map((item) => (
              <OpportunityRow
                key={item.id}
                opportunity={item}
                isLocked={isLocked}
                onSelect={onSelect}
                selection={selection}
                holding={holdingOf(item)}
              />
            ))}
          </Fragment>
        ))}
      </TableBody>
    </TableCard>
  )
}
