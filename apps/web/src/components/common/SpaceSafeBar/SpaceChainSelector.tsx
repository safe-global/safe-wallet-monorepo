import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import ChainSelectorBlock from '@/features/spaces/public/components/ChainSelectorBlock'
import CreateSafeOnNewChain from '@/features/multichain/public/components/CreateSafeOnNewChain'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'
import { useIsSafeBarControlDisabled } from '@/hooks/useIsSafeBarControlDisabled'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { trackEvent } from '@/services/analytics'
import type { ChainSelectorBlockProps } from '@/features/spaces/public/components/ChainSelectorBlock'
import type { ChainInfo } from '@/features/spaces/public/types'

function SpaceChainSelectorSkeleton() {
  return (
    <div className="self-stretch min-h-10 order-last flex items-center rounded-lg bg-muted px-4">
      <Skeleton className="size-6 rounded-full" />
    </div>
  )
}

// min-h-10 matches the safe selector's own `h-10` — see SpaceNestedSafesButton.
const CHIP_CLASS = 'self-stretch min-h-10 order-last flex items-stretch rounded-lg bg-muted'

const noop = () => {}

function DisabledChainSelector(props: Omit<ChainSelectorBlockProps, 'disabled'>) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <ChainSelectorBlock {...props} disabled />
      </TooltipTrigger>
      <TooltipContent>Changing the network is not allowed in this screen</TooltipContent>
    </Tooltip>
  )
}

/** The network chip for a fixed Safe: same look as the selector, never opens. */
export function LockedChainSelector({ chain, safeAddress }: { chain: ChainInfo; safeAddress: string }) {
  return (
    <div className={CHIP_CLASS} data-testid="space-chain-selector">
      <DisabledChainSelector
        deployedChains={[chain]}
        selectedChainId={chain.chainId}
        safeAddress={safeAddress}
        deployedChainIds={[chain.chainId]}
        onChainSelect={noop}
        onAddNetwork={noop}
      />
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

  if (!isHydrated) {
    return <SpaceChainSelectorSkeleton />
  }

  if (!deployedChains.length) {
    if (isLoading) {
      return <SpaceChainSelectorSkeleton />
    }
    return null
  }

  return (
    <div className={CHIP_CLASS} data-testid="space-chain-selector">
      {isDisabled ? (
        <DisabledChainSelector
          deployedChains={deployedChains}
          selectedChainId={selectedChainId}
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          onChainSelect={handleChainSelect}
          onAddNetwork={handleAddNetwork}
        />
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
