import { useMemo, useState } from 'react'
import { useAddNetworkState } from '@/features/multichain'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { AllNetworksSectionView } from '@views/features/spaces/components/SafeSelectorDropdown/components/AllNetworksSectionView'

const ALL_NETWORKS_ITEM = 'all-networks'

export interface AllNetworksSectionProps {
  safeAddress: string
  deployedChainIds: string[]
  onAddNetwork: (chainId: string) => void
  /** Lower-cased query from the picker's search field. Filters the list and keeps the section open. */
  search?: string
  /** Whether the rows above the section match the query. Decides who owns the no-matches line. */
  hasMatchesAbove?: boolean
}

function AllNetworksSection({
  safeAddress,
  deployedChainIds,
  onAddNetwork,
  search,
  hasMatchesAbove,
}: AllNetworksSectionProps) {
  const { loading, availableNetworks, unavailableReason, error, isFeatureEnabled } = useAddNetworkState(
    safeAddress,
    deployedChainIds,
  )
  const [openItems, setOpenItems] = useState<string[]>([])

  const matchingNetworks = useMemo(
    () =>
      search
        ? availableNetworks.filter((chainItem) => chainItem.chainName.toLowerCase().includes(search))
        : availableNetworks,
    [availableNetworks, search],
  )

  const handleAccordionChange = (value: unknown) => {
    const openedIds = Array.isArray(value) ? (value as string[]) : []
    setOpenItems(openedIds)
    if (openedIds.includes(ALL_NETWORKS_ITEM)) {
      trackEvent(OVERVIEW_EVENTS.SHOW_ALL_NETWORKS)
    }
  }

  const handleChainClick = (chainId: string) => {
    trackEvent({ ...OVERVIEW_EVENTS.ADD_NEW_NETWORK, label: OVERVIEW_LABELS.top_bar })
    onAddNetwork(chainId)
  }

  return (
    <AllNetworksSectionView
      isFeatureEnabled={isFeatureEnabled}
      loading={loading}
      unavailableReason={unavailableReason}
      errorMessage={error?.message}
      hasAvailableNetworks={availableNetworks.length > 0}
      matchingNetworks={matchingNetworks}
      search={search}
      hasMatchesAbove={hasMatchesAbove}
      accordionItem={ALL_NETWORKS_ITEM}
      openItems={openItems}
      onAccordionChange={handleAccordionChange}
      onChainClick={handleChainClick}
    />
  )
}

export default AllNetworksSection
