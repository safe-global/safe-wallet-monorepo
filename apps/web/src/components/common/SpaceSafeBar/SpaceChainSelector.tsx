import { useEffect, useState, useCallback } from 'react'
import { ChainSelectorBlock } from '@/features/spaces'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import {
  SpaceChainSelectorSkeleton,
  SpaceChainSelectorView,
} from '@views/components/common/SpaceSafeBar/SpaceChainSelectorView'

function SpaceChainSelector({ isLoading }: { isLoading?: boolean }) {
  const { deployedChains, selectedChainId, deployedChainIds, safeAddress, safeName, handleChainChange } =
    useSpaceChainSelector()
  const isDisabled = useIsSafeBarControlDisabled()

  const [addNetworkChainId, setAddNetworkChainId] = useState<string>()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleAddNetwork = useCallback((chainId: string) => {
    setAddNetworkChainId(chainId)
    trackEvent(OVERVIEW_EVENTS.ADD_NEW_NETWORK)
  }, [])

  const handleChainSelect = useCallback(
    (chainId: string) => {
      handleChainChange(chainId)
      trackEvent(OVERVIEW_EVENTS.SWITCH_NETWORK)
    },
    [handleChainChange],
  )

  const handleCloseDialog = useCallback(() => {
    setAddNetworkChainId(undefined)
  }, [])

  if (!isHydrated) return <SpaceChainSelectorSkeleton />

  if (!deployedChains.length) {
    if (isLoading) return <SpaceChainSelectorSkeleton />
    return null
  }

  return (
    <SpaceChainSelectorView
      isDisabled={isDisabled}
      renderChainSelector={(props) => (
        <ChainSelectorBlock
          deployedChains={deployedChains}
          selectedChainId={selectedChainId}
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          onChainSelect={handleChainSelect}
          onAddNetwork={handleAddNetwork}
          {...props}
        />
      )}
      addNetworkDialog={
        addNetworkChainId && (
          <CreateSafeOnNewChain
            open
            onClose={handleCloseDialog}
            currentName={safeName}
            safeAddress={safeAddress}
            deployedChainIds={deployedChainIds}
            defaultChainId={addNetworkChainId}
          />
        )
      }
    />
  )
}

export default SpaceChainSelector
