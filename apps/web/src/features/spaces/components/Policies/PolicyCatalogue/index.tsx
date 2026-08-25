import { type ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogueTile from './PolicyCatalogueTile'
import { POLICY_CATALOGUE, type PolicyCatalogueEntry, type PolicyCatalogueId } from './catalogue'

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
}

const PolicyCatalogue = ({ onSelect }: PolicyCatalogueProps): ReactElement => {
  const handleClick = ({ id, isAvailable }: PolicyCatalogueEntry) => {
    trackEvent(POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, {
      [MixpanelEventParams.POLICY_TYPE]: id,
      [MixpanelEventParams.IS_AVAILABLE]: isAvailable,
    })

    if (isAvailable) onSelect?.(id)
  }

  return (
    <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-2">
      {POLICY_CATALOGUE.map((entry) => (
        <PolicyCatalogueTile key={entry.id} {...entry} onClick={() => handleClick(entry)} />
      ))}
    </div>
  )
}

export default PolicyCatalogue
