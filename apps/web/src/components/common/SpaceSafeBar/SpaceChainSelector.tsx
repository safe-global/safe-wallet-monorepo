import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
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
    <div
      className="self-stretch sm:order-last flex items-stretch shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg bg-card"
      data-testid="space-chain-selector"
    >
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <ChainSelectorBlock
              deployedChains={deployedChains}
              selectedChainId={selectedChainId}
              safeAddress={safeAddress}
              deployedChainIds={deployedChainIds}
              onChainSelect={handleChainSelect}
              onAddNetwork={handleAddNetwork}
              disabled
            />
          </TooltipTrigger>
          <TooltipContent>Changing the network is not allowed in this screen</TooltipContent>
        </Tooltip>
      ) : (
        <ChainSelectorBlock
          deployedChains={deployedChains}
          selectedChainId={selectedChainId}
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          onChainSelect={handleChainSelect}
          onAddNetwork={handleAddNetwork}
        />
      )}

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
