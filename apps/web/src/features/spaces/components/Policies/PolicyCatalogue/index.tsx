import { type ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { PolicyLock } from '../policyLock'
import PolicyCatalogueTile from './PolicyCatalogueTile'
import { POLICY_CATALOGUE, type PolicyCatalogueEntry, type PolicyCatalogueId, type PolicyId } from './catalogue'

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
  /** Set when the workspace's plan does not include policies: every tile then leads to the upgrade. */
  locked?: Pick<PolicyLock, 'accountCounts' | 'onUpgrade'>
}

const isPolicyEntry = (entry: PolicyCatalogueEntry): entry is PolicyCatalogueEntry & { id: PolicyId } =>
  entry.id !== 'suggestion'

const PolicyCatalogue = ({ onSelect, locked }: PolicyCatalogueProps): ReactElement => {
  const handleClick = ({ id }: PolicyCatalogueEntry) => {
    trackEvent({ ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id }, { [MixpanelEventParams.POLICY_TYPE]: id })

    if (locked) {
      locked.onUpgrade()
      return
    }

    onSelect?.(id)
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
    <div data-testid="policy-catalogue" className="grid gap-4 md:grid-cols-3">
      {POLICY_CATALOGUE.map((entry) => (
        <PolicyCatalogueTile key={entry.id} {...entry} onClick={() => handleClick(entry)} />
      ))}
    </div>
  )
}

export default PolicyCatalogue
