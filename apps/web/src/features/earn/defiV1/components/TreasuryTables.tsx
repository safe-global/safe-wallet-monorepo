import { Fragment, useState, type ReactNode } from 'react'
import { ChevronDown, Clock, Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Card, CardContent } from '@safe-global/views/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@safe-global/views/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@safe-global/views/components/ui/table'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy, formatCompactUsd, formatUsd } from '../copy'
import type { Opportunity } from '../types'

const BAND_CELL = 'bg-foreground/[0.03] py-0! transition-colors group-hover/band:bg-foreground/[0.06]'
const COLUMN_WIDTHS = ['w-10', 'w-[16rem]', 'w-56', 'w-28', 'w-48', '', 'w-20', 'w-32']
const COLUMN_COUNT = COLUMN_WIDTHS.length
const INVESTMENT_HEADERS = ['Position', 'Exit time', 'Network', 'Deposited', 'Earned', 'Rate']
const OPPORTUNITY_HEADERS = ['Opportunity', 'Exit time', 'Risk', 'Access', 'Networks', 'Rate']
const INVESTMENTS_SECTION = 'investments'
const OPPORTUNITIES_SECTION = 'opportunities'

export const MORE_GROUP = 'more'

export type Position = { opportunity: Opportunity; principal: number; earned: number; pending: boolean }

export type OpportunityGroup = { id: string; title: string; subtitle?: string; items: Opportunity[] }

const Chevron = ({ collapsed }: { collapsed: boolean }) => (
  <span className="flex justify-center">
    <ChevronDown
      className={cn('size-4! shrink-0 text-muted-foreground transition-transform', collapsed && '-rotate-90')}
      aria-hidden
    />
  </span>
)

const SectionBand = ({
  id,
  title,
  subtitle,
  aside,
  collapsed,
  nested,
  onToggle,
}: {
  id: string
  title: string
  subtitle?: string
  aside: ReactNode
  collapsed: boolean
  nested?: boolean
  onToggle: (id: string) => void
}) => (
  <TableRow
    data-no-hover
    data-no-divider
    className="group/band cursor-pointer"
    onClick={() => onToggle(id)}
    aria-expanded={!collapsed}
    data-testid={`shelf-${id}`}
  >
    <TableCell className={cn('rounded-l-lg', nested ? 'py-0!' : BAND_CELL)}>
      <Chevron collapsed={collapsed} />
    </TableCell>
    <TableCell colSpan={COLUMN_COUNT - 1} className={cn('rounded-r-lg pr-3!', nested ? 'py-0!' : BAND_CELL)}>
      <div className={cn('flex items-center gap-3', nested ? 'min-h-9' : 'min-h-11')}>
        <span className="text-sm font-medium text-foreground">{title}</span>
        {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted-foreground">{aside}</span>
      </div>
    </TableCell>
  </TableRow>
)

const ColumnHeaders = ({ labels }: { labels: string[] }) => (
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
)

const NameCell = ({ opportunity }: { opportunity: Opportunity }) => (
  <div className="flex min-w-0 flex-col">
    <span className="truncate font-medium text-foreground">{opportunity.name}</span>
    <span className="truncate text-xs text-muted-foreground">
      {opportunity.runBy}
      {opportunity.curator ? ` · curated by ${opportunity.curator}` : ''}
    </span>
  </div>
)

const ExitCell = ({ label }: { label: string }) => (
  <span className="flex items-center gap-1.5 whitespace-normal">
    <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    {label}
  </span>
)

const AccessBadges = ({ opportunity, locked }: { opportunity: Opportunity; locked: boolean }) => (
  <span className="flex flex-wrap gap-1">
    {opportunity.kyc && <Badge variant="outline">{DEFI_V1_COPY.kyc}</Badge>}
    {opportunity.access === 'pro' && (
      <Badge variant={locked ? 'outline' : 'brand'}>
        {locked && <Lock data-icon="inline-start" />}
        {DEFI_V1_COPY.proOnly}
      </Badge>
    )}
    {opportunity.placement === 'featured' && <Badge variant="info">{DEFI_V1_COPY.featured}</Badge>}
    {opportunity.placement === 'premium' && <Badge variant="info">{DEFI_V1_COPY.premium}</Badge>}
    {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
    {!opportunity.kyc && opportunity.access === 'all' && opportunity.placement === 'base' && (
      <span className="text-xs text-muted-foreground">Open to all</span>
    )}
  </span>
)

const OpportunityRow = ({
  opportunity,
  isLocked,
  onSelect,
  onDeposit,
}: {
  opportunity: Opportunity
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onDeposit: (item: Opportunity) => void
}) => {
  const locked = isLocked(opportunity)
  return (
    <TableRow
      className={cn('cursor-pointer', locked && 'opacity-70')}
      onClick={() => onSelect(opportunity)}
      data-testid={`opportunity-${opportunity.id}`}
    >
      <TableCell />
      <TableCell>
        <NameCell opportunity={opportunity} />
      </TableCell>
      <TableCell>
        <ExitCell label={opportunity.exitLabel} />
      </TableCell>
      <TableCell className="text-muted-foreground">{DEFI_V1_COPY.risk[opportunity.risk]}</TableCell>
      <TableCell>
        <AccessBadges opportunity={opportunity} locked={locked} />
      </TableCell>
      <TableCell className="truncate text-muted-foreground">{opportunity.chains.join(', ')}</TableCell>
      <TableCell className="tabular-nums">{formatApy(opportunity.apy)}</TableCell>
      <TableCell className="text-right">
        <Button
          variant="outline"
          size="xs"
          onClick={(event) => {
            event.stopPropagation()
            if (locked) onSelect(opportunity)
            else onDeposit(opportunity)
          }}
        >
          {locked && <Lock />}
          {locked ? DEFI_V1_COPY.proOnly : DEFI_V1_COPY.factSheet.deposit}
        </Button>
      </TableCell>
    </TableRow>
  )
}

const InvestmentRow = ({ position, onWithdraw }: { position: Position; onWithdraw: (position: Position) => void }) => (
  <TableRow data-testid={`position-${position.opportunity.id}`}>
    <TableCell />
    <TableCell>
      <NameCell opportunity={position.opportunity} />
    </TableCell>
    <TableCell>
      <ExitCell label={position.opportunity.exitLabel} />
    </TableCell>
    <TableCell className="text-muted-foreground">{position.opportunity.chains[0]}</TableCell>
    <TableCell className="tabular-nums">{formatUsd(position.principal)}</TableCell>
    <TableCell className="tabular-nums text-badge-dot-success">
      {position.earned > 0 ? `+${formatUsd(position.earned)}` : '—'}
    </TableCell>
    <TableCell className="tabular-nums">{formatApy(position.opportunity.apy)}</TableCell>
    <TableCell className="text-right">
      {position.pending ? (
        <Badge variant="warning">{DEFI_V1_COPY.positions.pending}</Badge>
      ) : (
        <Button variant="outline" size="xs" onClick={() => onWithdraw(position)}>
          {DEFI_V1_COPY.positions.withdraw}
        </Button>
      )}
    </TableCell>
  </TableRow>
)

const WithdrawDialog = ({ position, onClose }: { position: Position | null; onClose: () => void }) => {
  const copy = DEFI_V1_COPY.positions
  return (
    <Dialog open={position !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        {position && (
          <>
            <DialogHeader>
              <DialogTitle>{copy.withdrawTitle(position.opportunity.name)}</DialogTitle>
              <DialogDescription>{copy.withdrawLead}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 px-4 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{copy.principal}</span>
                <span className="font-medium">{formatUsd(position.principal + position.earned)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{copy.exit}</span>
                <span className="font-medium">{position.opportunity.exitLabel}</span>
              </div>
            </div>
            <DialogFooter>
              <Button size="lg" onClick={onClose}>
                {DEFI_V1_COPY.deposit.createProposal}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export const TreasuryTable = ({
  positions,
  groups,
  flat,
  isLocked,
  onSelect,
  onDeposit,
}: {
  positions: Position[]
  groups: OpportunityGroup[]
  flat?: boolean
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onDeposit: (item: Opportunity) => void
}) => {
  const [collapsed, setCollapsed] = useState<string[]>([INVESTMENTS_SECTION, MORE_GROUP])
  const [withdrawing, setWithdrawing] = useState<Position | null>(null)
  const toggle = (id: string) =>
    setCollapsed((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  const isCollapsed = (id: string) => collapsed.includes(id)
  const rowProps = { isLocked, onSelect, onDeposit }
  const deposited = positions.reduce((sum, position) => sum + position.principal, 0)
  const optionCount = groups.reduce((sum, group) => sum + group.items.length, 0)
  const opportunitiesCollapsed = isCollapsed(OPPORTUNITIES_SECTION)

  return (
    <Card radius="xl" size="none">
      <CardContent>
        <Table aria-label="Treasury" variant="panel" className="table-fixed min-w-[960px] [&_td]:px-4 [&_th]:px-4">
          <colgroup>
            {COLUMN_WIDTHS.map((width, index) => (
              <col key={index} className={width || undefined} />
            ))}
          </colgroup>

          <TableBody>
            <SectionBand
              id={INVESTMENTS_SECTION}
              title="Investments"
              collapsed={isCollapsed(INVESTMENTS_SECTION)}
              onToggle={toggle}
              aside={
                <>
                  <span>
                    {positions.length} {positions.length === 1 ? 'investment' : 'investments'}
                  </span>
                  <Badge variant="subtle">{formatCompactUsd(deposited)}</Badge>
                </>
              }
            />
          </TableBody>
          <TableBody hidden={isCollapsed(INVESTMENTS_SECTION)} data-testid="defi-positions">
            {positions.length > 0 ? (
              <>
                <ColumnHeaders labels={INVESTMENT_HEADERS} />
                {positions.map((position, index) => (
                  <InvestmentRow
                    key={`${position.opportunity.id}-${index}`}
                    position={position}
                    onWithdraw={setWithdrawing}
                  />
                ))}
              </>
            ) : (
              <TableRow data-no-hover>
                <TableCell colSpan={COLUMN_COUNT} className="py-6 text-center text-muted-foreground">
                  No investments yet. Deposit from an opportunity below.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <TableBody>
            <SectionBand
              id={OPPORTUNITIES_SECTION}
              title="Opportunities"
              collapsed={opportunitiesCollapsed}
              onToggle={toggle}
              aside={<span>{optionCount} options</span>}
            />
          </TableBody>
          <TableBody hidden={opportunitiesCollapsed}>
            <ColumnHeaders labels={OPPORTUNITY_HEADERS} />
            {flat &&
              groups
                .flatMap((group) => group.items)
                .map((item) => <OpportunityRow key={item.id} opportunity={item} {...rowProps} />)}
          </TableBody>
          {!flat &&
            groups.map((group) => (
              <Fragment key={group.id}>
                <TableBody hidden={opportunitiesCollapsed}>
                  <SectionBand
                    id={group.id}
                    title={group.title}
                    subtitle={group.subtitle}
                    nested
                    collapsed={isCollapsed(group.id)}
                    onToggle={toggle}
                    aside={<Badge variant="subtle">{group.items.length}</Badge>}
                  />
                </TableBody>
                <TableBody hidden={opportunitiesCollapsed || isCollapsed(group.id)}>
                  {group.items.map((item) => (
                    <OpportunityRow key={item.id} opportunity={item} {...rowProps} />
                  ))}
                </TableBody>
              </Fragment>
            ))}
        </Table>
      </CardContent>
      <WithdrawDialog position={withdrawing} onClose={() => setWithdrawing(null)} />
    </Card>
  )
}
