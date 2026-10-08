import { useMemo, useState } from 'react'
import AllNetworksSection from './AllNetworksSection'
import { ChainSelectorBlockView } from '@views/features/spaces/components/SafeSelectorDropdown/components/ChainSelectorBlockView'
import type { ChainInfo } from '@/features/spaces/types'

export interface ChainSelectorBlockProps {
  deployedChains: ChainInfo[]
  selectedChainId: string
  safeAddress: string
  deployedChainIds: string[]
  onChainSelect: (chainId: string, event?: React.MouseEvent) => void
  onAddNetwork: (chainId: string) => void
  disabled?: boolean
}

function ChainSelectorBlock({
  deployedChains,
  selectedChainId,
  safeAddress,
  deployedChainIds,
  onChainSelect,
  onAddNetwork,
  disabled = false,
}: ChainSelectorBlockProps) {
  const displayChainId = selectedChainId || deployedChains[0]?.chainId
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const matchingChains = useMemo(
    () =>
      query ? deployedChains.filter((chainItem) => chainItem.chainName.toLowerCase().includes(query)) : deployedChains,
    [deployedChains, query],
  )

  const handleAddNetworkClick = (chainId: string) => {
    setOpen(false)
    onAddNetwork(chainId)
  }

  const handleOpenChange = (next: boolean) => {
    if (disabled) return
    setOpen(next)
    // This block stays mounted across close, so the next opening would start filtered.
    setSearch('')
  }

  const handleChainClick = (chainId: string, event: React.MouseEvent) => {
    setOpen(false)
    onChainSelect(chainId, event)
  }

  return (
    <ChainSelectorBlockView
      displayChainId={displayChainId}
      matchingChains={matchingChains}
      open={open}
      onOpenChange={handleOpenChange}
      search={search}
      onSearchChange={setSearch}
      onChainClick={handleChainClick}
      disabled={disabled}
      allNetworksSection={
        <AllNetworksSection
          safeAddress={safeAddress}
          deployedChainIds={deployedChainIds}
          onAddNetwork={handleAddNetworkClick}
          search={query}
          hasMatchesAbove={matchingChains.length > 0}
        />
      }
    />
  )
}

export default ChainSelectorBlock
