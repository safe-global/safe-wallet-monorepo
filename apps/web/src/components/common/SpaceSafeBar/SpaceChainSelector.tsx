import { useState, useCallback } from 'react'
import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'
import { CreateSafeOnNewChain } from '@/features/multichain'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'

function SpaceChainSelector() {
  const {
    deployedChains,
    availableChains,
    selectedChainId,
    deployedChainIds,
    safeAddress,
    safeName,
    handleChainChange,
  } = useSpaceChainSelector()

  const [addNetworkChainId, setAddNetworkChainId] = useState<string>()

  const handleAddNetwork = useCallback((chainId: string) => {
    setAddNetworkChainId(chainId)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setAddNetworkChainId(undefined)
  }, [])

  if (!deployedChains.length) return null

  return (
    <div
      className="self-stretch sm:order-last flex items-stretch shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)] rounded-lg bg-card"
      data-testid="space-chain-selector"
    >
      <ChainSelectorBlock
        deployedChains={deployedChains}
        availableChains={availableChains}
        selectedChainId={selectedChainId}
        onChainSelect={handleChainChange}
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
