import { useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

function SpaceChainSelectorSkeleton() {
  return (
    <div className="self-stretch sm:order-last flex items-center rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] px-4">
      <Skeleton className="size-6 rounded-full" />
    </div>
  )
}

function SpaceChainSelector({ isLoading }: { isLoading?: boolean }) {
  const { deployedChains, selectedChainId, deployedChainIds, safeAddress, safeName, handleChainChange } =
    useSpaceChainSelector()

  const [addNetworkChainId, setAddNetworkChainId] = useState<string>()

  const handleAddNetwork = useCallback((chainId: string) => {
    setAddNetworkChainId(chainId)
    trackEvent(OVERVIEW_EVENTS.ADD_NEW_NETWORK)
  }, [])

  const handleChainSelect = useCallback(
    (chainId: string, event?: React.MouseEvent) => {
      handleChainChange(chainId, event)
      trackEvent(OVERVIEW_EVENTS.SWITCH_NETWORK)
    },
    [handleChainChange],
  )

  const handleCloseDialog = useCallback(() => {
    setAddNetworkChainId(undefined)
  }, [])

  if (!deployedChains.length) {
    if (isLoading) return <SpaceChainSelectorSkeleton />
    return null
  }

  return (
    <div
      className="self-stretch sm:order-last flex items-stretch shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg bg-card"
      data-testid="space-chain-selector"
    >
      <ChainSelectorBlock
        deployedChains={deployedChains}
        selectedChainId={selectedChainId}
        safeAddress={safeAddress}
        deployedChainIds={deployedChainIds}
        onChainSelect={handleChainSelect}
        onAddNetwork={handleAddNetwork}
      />

      {addNetworkChainId && (
        <CreateSafeOnNewChain
          open
          onClose={handleCloseDialog}
          currentName={safeName}
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          defaultChainId={addNetworkChainId}
        />
      )}
    </div>
  )
}

export default SpaceChainSelector
