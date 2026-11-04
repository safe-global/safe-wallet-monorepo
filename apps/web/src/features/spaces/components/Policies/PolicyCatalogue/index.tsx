import { type ReactElement } from 'react'
import { cn } from '@safe-global/views/utils/cn'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { PolicyLock } from '@safe-global/views/features/spaces/components/Policies/policyLock'
import PolicyCatalogueTile from '@safe-global/views/features/spaces/components/Policies/PolicyCatalogue/PolicyCatalogueTile'
import {
  POLICY_CATALOGUE,
  type PolicyCatalogueEntry,
  type PolicyCatalogueId,
  type PolicyId,
} from '@safe-global/views/features/spaces/components/Policies/PolicyCatalogue/catalogue'

interface PolicyCatalogueProps {
  onSelect?: (id: PolicyCatalogueId) => void
  /** Set when the workspace's plan does not include some policies: their tiles then lead to the upgrade. */
  locked?: Pick<PolicyLock, 'lockedPolicies' | 'accountCounts' | 'onUpgrade'>
  /** Without it the recipient allowlist tile is left out: no chain has the allowlist enabled. */
  isAllowlistAvailable?: boolean
}

const isPolicyEntry = (entry: PolicyCatalogueEntry): entry is PolicyCatalogueEntry & { id: PolicyId } =>
  entry.id !== 'suggestion'

const PolicyCatalogue = ({ onSelect, locked, isAllowlistAvailable = false }: PolicyCatalogueProps): ReactElement => {
  const isLocked = (id: PolicyCatalogueId) => locked?.lockedPolicies.some((lockedId) => lockedId === id) ?? false

  const handleClick = ({ id }: PolicyCatalogueEntry) => {
    trackEvent({ ...POLICY_EVENTS.POLICY_CATALOGUE_TILE_CLICKED, label: id }, { [MixpanelEventParams.POLICY_TYPE]: id })

    if (isLocked(id)) {
      locked?.onUpgrade()
      return
    }

    onSelect?.(id)
  }

  const entries = POLICY_CATALOGUE.filter(
    (entry) => (isAllowlistAvailable || entry.id !== 'recipient-allowlist') && (!locked || isPolicyEntry(entry)),
  )

  return (
    <div
      data-testid="policy-catalogue"
      className={cn('grid gap-4', entries.length === 4 ? 'md:grid-cols-2' : 'md:grid-cols-3')}
    >
      {entries.map((entry) => (
        <PolicyCatalogueTile
          key={entry.id}
          {...entry}
          locked={isLocked(entry.id)}
          accountCount={isPolicyEntry(entry) ? locked?.accountCounts?.[entry.id] : undefined}
          onClick={() => handleClick(entry)}
        />
      ))}
    </div>
  )
}

export default PolicyCatalogue
