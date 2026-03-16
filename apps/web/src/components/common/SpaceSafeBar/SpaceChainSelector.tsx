import ChainSelectorBlock from '@/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlock'
import { useSpaceChainSelector } from './hooks/useSpaceChainSelector'

function SpaceChainSelector() {
  const { chains, selectedChainId, hasMultipleChains, handleChainChange } = useSpaceChainSelector()

  if (!chains.length) return null

  return (
    <div className="self-stretch sm:order-last flex items-stretch shadow-[0px_4px_20px_0px_rgba(0,0,0,0.07)] rounded-lg bg-card">
      <ChainSelectorBlock
        hasMultipleChains={hasMultipleChains}
        chains={chains}
        selectedChainId={selectedChainId}
        onChainSelect={handleChainChange}
      />
    </div>
  )
}

export default SpaceChainSelector
