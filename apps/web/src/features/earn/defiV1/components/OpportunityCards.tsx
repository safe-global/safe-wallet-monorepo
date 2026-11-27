import { Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy } from '../copy'
import type { Holding, Operation, Opportunity } from '../types'
import {
  ClassBadge,
  ExitCell,
  NetworkLogos,
  OpportunityMark,
  PositionCell,
  SponsoredBadge,
  alertFor,
  type OpportunityGroup,
} from './TreasuryTables'

const COLUMNS = DEFI_V1_COPY.columns

const OpportunityCard = ({
  opportunity,
  locked,
  onSelect,
  onDeposit,
  holding,
  safes,
  heldIn,
}: {
  opportunity: Opportunity
  locked: boolean
  onSelect: (item: Opportunity) => void
  onDeposit: (item: Opportunity) => void
  holding?: Holding
  safes?: string[]
  heldIn?: Operation
}) => {
  const alert = alertFor(holding, heldIn)
  const act = locked || holding ? () => onSelect(opportunity) : () => onDeposit(opportunity)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(opportunity)}
      onKeyDown={(event) => event.key === 'Enter' && onSelect(opportunity)}
      className={cn(
        'flex cursor-pointer flex-col gap-4 rounded-xl bg-card p-4 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring',
        locked && 'opacity-70',
      )}
      data-testid={`opportunity-card-${opportunity.id}`}
    >
      <div className="flex items-start gap-3">
        <OpportunityMark opportunity={opportunity} invested={Boolean(holding)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{opportunity.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{opportunity.asset}</span> · {opportunity.runBy}
          </span>
        </div>
        <ClassBadge type={opportunity.type} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-2xl font-semibold tabular-nums">{formatApy(opportunity.apy)}</span>
          <span className="text-xs text-muted-foreground">{COLUMNS.apy}</span>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <ExitCell opportunity={opportunity} />
          <NetworkLogos chains={opportunity.chains} />
        </div>
      </div>

      {(opportunity.placement === 'sponsored' || alert) && (
        <div className="flex flex-wrap gap-2">
          {opportunity.placement === 'sponsored' && <SponsoredBadge />}
          {alert && (
            <Tooltip delay={150}>
              <TooltipTrigger render={<span className="flex shrink-0" />}>
                <Badge variant="warning">{alert.label}</Badge>
              </TooltipTrigger>
              <TooltipContent>{alert.detail}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
        <div className="flex min-w-0 flex-col gap-0.5 text-sm">
          {holding && <span className="text-xs text-muted-foreground">{COLUMNS.position}</span>}
          {holding && <PositionCell holding={holding} safes={safes} />}
        </div>
        <Button
          variant={holding || locked ? 'outline' : 'default'}
          size="sm"
          onClick={(event) => {
            event.stopPropagation()
            act()
          }}
          data-testid={holding ? `manage-${opportunity.id}` : `deposit-${opportunity.id}`}
        >
          {locked && <Lock />}
          {locked ? DEFI_V1_COPY.proOnly : holding ? DEFI_V1_COPY.manage : DEFI_V1_COPY.action.deposit}
        </Button>
      </div>
    </div>
  )
}

/** The same groups as the table, as a grid of cards. Compare and sort stay in table view. */
export const OpportunityCards = ({
  label,
  groups,
  isLocked,
  onSelect,
  onDeposit,
  safesOf,
  holdingOf,
  heldInOf,
}: {
  label: string
  groups: OpportunityGroup[]
  isLocked: (item: Opportunity) => boolean
  onSelect: (item: Opportunity) => void
  onDeposit: (item: Opportunity) => void
  safesOf?: (item: Opportunity) => string[]
  holdingOf: (item: Opportunity) => Holding | undefined
  heldInOf: (item: Opportunity) => Operation | undefined
}) => {
  if (groups.every((group) => group.items.length === 0))
    return (
      <Typography variant="paragraph-small" color="muted" className="py-6 text-center">
        {DEFI_V1_COPY.noMatches}
      </Typography>
    )
  return (
    <div className="flex flex-col gap-6" data-testid="defi-opportunities">
      {groups.map((group) =>
        group.items.length === 0 ? null : (
          <div key={group.key} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Typography variant="paragraph-bold">{group.title ?? label}</Typography>
              <Badge variant="subtle">{group.items.length}</Badge>
            </div>
            <div className="grid gap-3 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {group.items.map((item) => (
                <OpportunityCard
                  key={item.id}
                  opportunity={item}
                  locked={isLocked(item)}
                  onSelect={onSelect}
                  onDeposit={onDeposit}
                  holding={holdingOf(item)}
                  safes={safesOf?.(item)}
                  heldIn={heldInOf(item)}
                />
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
