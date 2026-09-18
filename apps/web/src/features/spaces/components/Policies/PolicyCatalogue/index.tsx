import { type ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import PolicyCatalogueTile, { type PolicyAccountCount } from './PolicyCatalogueTile'
import { POLICY_CATALOGUE, type PolicyCatalogueEntry, type PolicyCatalogueId, type PolicyId } from './catalogue'

/** The workspace's plan does not include policies: every policy tile is gated behind an upgrade. */
export type PolicyCatalogueLock = {
  accountCounts: Record<PolicyId, PolicyAccountCount>
  onUpgrade: () => void
}

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
  locked?: PolicyCatalogueLock
}

const isPolicyEntry = (entry: PolicyCatalogueEntry): entry is PolicyCatalogueEntry & { id: PolicyId } =>
  entry.id !== 'suggestion'

const PolicyCatalogue = ({ onSelect, locked }: PolicyCatalogueProps): ReactElement => {
  const handleClick = ({ id, isAvailable }: PolicyCatalogueEntry) => {
    trackEvent(
      { ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id },
      {
        [MixpanelEventParams.POLICY_TYPE]: id,
        [MixpanelEventParams.IS_AVAILABLE]: isAvailable,
      },
    )

    if (locked) {
      locked.onUpgrade()
      return
    }

    if (isAvailable) onSelect?.(id)
  }

  if (locked) {
    return (
      <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-3">
        {POLICY_CATALOGUE.filter(isPolicyEntry).map((entry) => (
          <PolicyCatalogueTile
            key={entry.id}
            {...entry}
            locked={locked.accountCounts[entry.id]}
            onClick={() => handleClick(entry)}
          />
        ))}
      </div>
    )
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
