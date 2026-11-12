import { Clock, Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { cn } from '@safe-global/views/utils/cn'
import { DEFI_V1_COPY, formatApy } from '../copy'
import type { Opportunity } from '../types'

export const OpportunityBadges = ({ opportunity, locked }: { opportunity: Opportunity; locked: boolean }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <Badge variant="subtle">{DEFI_V1_COPY.risk[opportunity.risk]}</Badge>
    {opportunity.kyc && <Badge variant="outline">{DEFI_V1_COPY.kyc}</Badge>}
    {opportunity.access === 'pro' && (
      <Badge variant={locked ? 'outline' : 'brand'}>
        {locked && <Lock data-icon="inline-start" />}
        {DEFI_V1_COPY.proOnly}
      </Badge>
    )}
    {opportunity.placement === 'sponsored' && <Badge variant="warning">{DEFI_V1_COPY.sponsored}</Badge>}
    {opportunity.placement === 'featured' && <Badge variant="info">{DEFI_V1_COPY.featured}</Badge>}
    {opportunity.placement === 'premium' && <Badge variant="info">{DEFI_V1_COPY.premium}</Badge>}
  </div>
)

export const OpportunityRow = ({
  opportunity,
  locked,
  onSelect,
}: {
  opportunity: Opportunity
  locked: boolean
  onSelect: (opportunity: Opportunity) => void
}) => (
  <button
    type="button"
    onClick={() => onSelect(opportunity)}
    data-testid={`opportunity-${opportunity.id}`}
    className={cn(
      'flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between',
      locked && 'opacity-70',
    )}
  >
    <div className="flex min-w-0 flex-col gap-1.5">
      <Typography variant="paragraph-bold">{opportunity.name}</Typography>
      <Typography variant="paragraph-small" color="muted">
        {opportunity.runBy}
        {opportunity.curator ? ` · curated by ${opportunity.curator}` : ''} · {opportunity.chains.join(', ')}
      </Typography>
      <OpportunityBadges opportunity={opportunity} locked={locked} />
    </div>

    <div className="flex shrink-0 gap-6 sm:text-right">
      <div className="flex flex-col gap-0.5 sm:w-44">
        <Typography variant="paragraph-mini" color="muted">
          {DEFI_V1_COPY.exitLabel}
        </Typography>
        <Typography variant="paragraph-small-medium" className="flex items-center gap-1 sm:justify-end">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {opportunity.exitLabel}
        </Typography>
      </div>
      <div className="flex flex-col gap-0.5 sm:w-20">
        <Typography variant="paragraph-mini" color="muted">
          {DEFI_V1_COPY.apyLabel}
        </Typography>
        <Typography variant="paragraph-small-medium">{formatApy(opportunity.apy)}</Typography>
      </div>
    </div>
  </button>
)
