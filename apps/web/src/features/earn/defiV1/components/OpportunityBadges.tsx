import { Lock } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { DEFI_V1_COPY } from '../copy'
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
