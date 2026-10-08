import { type ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { PolicyLock } from '@views/features/spaces/components/Policies/policyLock'
import { PolicyCatalogueView } from '@views/features/spaces/components/Policies/PolicyCatalogue/PolicyCatalogueView'
import {
  POLICY_CATALOGUE,
  type PolicyCatalogueEntry,
  type PolicyCatalogueId,
  type PolicyId,
} from '@views/features/spaces/components/Policies/PolicyCatalogue/catalogue'

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
  /** Set when the workspace's plan does not include some policies: their tiles then lead to the upgrade. */
  locked?: Pick<PolicyLock, 'lockedPolicies' | 'accountCounts' | 'onUpgrade'>
}

const isPolicyEntry = (entry: PolicyCatalogueEntry): entry is PolicyCatalogueEntry & { id: PolicyId } =>
  entry.id !== 'suggestion'

const PolicyCatalogue = ({ onSelect, locked }: PolicyCatalogueProps): ReactElement => {
  const isLocked = (id: PolicyCatalogueId) => locked?.lockedPolicies.some((lockedId) => lockedId === id) ?? false

  const handleClick = ({ id }: PolicyCatalogueEntry) => {
    trackEvent({ ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id }, { [MixpanelEventParams.POLICY_TYPE]: id })

    if (isLocked(id)) {
      locked?.onUpgrade()
      return
    }

    onSelect?.(id)
  }

  const entries = locked ? POLICY_CATALOGUE.filter(isPolicyEntry) : POLICY_CATALOGUE

  return (
    <PolicyCatalogueView
      entries={entries}
      isLocked={isLocked}
      getAccountCount={(entry) => (isPolicyEntry(entry) ? locked?.accountCounts?.[entry.id] : undefined)}
      onTileClick={handleClick}
    />
  )
}

export default PolicyCatalogue
