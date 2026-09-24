import { type ReactElement } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { usePlanGate, type PlanGate } from '../../../hooks/usePlanGate'
import PolicyCatalogueTile from './PolicyCatalogueTile'
import { POLICY_CATALOGUE, type PolicyCatalogueEntry, type PolicyCatalogueId } from './catalogue'

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
}

const PolicyCatalogue = ({ onSelect }: PolicyCatalogueProps): ReactElement => {
  const gates: Partial<Record<PolicyCatalogueId, PlanGate>> = {
    'spending-limit': usePlanGate(FEATURES.SPENDING_LIMIT_GATING),
    proposer: usePlanGate(FEATURES.PROPOSER_GATING),
  }

  const handleClick = ({ id }: PolicyCatalogueEntry) => {
    trackEvent({ ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id }, { [MixpanelEventParams.POLICY_TYPE]: id })
    onSelect?.(id)
  }

  return (
    <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-3">
      {POLICY_CATALOGUE.map((entry) => {
        const gate = gates[entry.id]
        return (
          <PolicyCatalogueTile
            key={entry.id}
            {...entry}
            onClick={() => handleClick(entry)}
            upgradeHref={gate?.isBlocked ? gate.upgradeHref : undefined}
            disabled={gate?.isLoading}
          />
        )
      })}
    </div>
  )
}

export default PolicyCatalogue
