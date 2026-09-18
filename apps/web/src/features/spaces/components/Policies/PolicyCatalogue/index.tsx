import { type ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogueTile, { type PolicyAccountCount } from './PolicyCatalogueTile'
import { POLICY_CATALOGUE, type PolicyCatalogueEntry, type PolicyCatalogueId } from './catalogue'

/** The workspace's plan does not include policies: every policy tile is gated behind an upgrade. */
export type PolicyCatalogueLock = {
  accountCounts: Partial<Record<PolicyCatalogueId, PolicyAccountCount>>
  onUpgrade: () => void
}

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
  locked?: PolicyCatalogueLock
}

const PolicyCatalogue = ({ onSelect, locked }: PolicyCatalogueProps): ReactElement => {
  const handleClick = ({ id, isAvailable }: PolicyCatalogueEntry) => {
    trackEvent(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id },
      {
        [MixpanelEventParams.POLICY_TYPE]: id,
        [MixpanelEventParams.IS_AVAILABLE]: isAvailable,
      },
    )

    if (locked && id !== 'suggestion') {
      locked.onUpgrade()
      return
    }

    if (isAvailable) onSelect?.(id)
  }

  return (
    <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-2">
      {POLICY_CATALOGUE.map((entry) => (
        <PolicyCatalogueTile
          key={entry.id}
          {...entry}
          locked={entry.id === 'suggestion' ? undefined : locked?.accountCounts[entry.id]}
          onClick={() => handleClick(entry)}
        />
      ))}
    </div>
  )
}

export default PolicyCatalogue
