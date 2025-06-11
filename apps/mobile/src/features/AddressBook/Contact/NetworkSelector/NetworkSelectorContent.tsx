import React from 'react'
import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ChainItem } from './ChainItem'
import { AllNetworksItem } from './AllNetworksItem'

interface NetworkSelectorContentProps {
  chainsToDisplay: Chain[]
  selectedChainIds: string[]
  isReadOnly: boolean
  isAllChainsSelected: boolean
  onChainToggle: (chainId: string) => void
  onSelectAll: () => void
  bottomInset: number
  topInset: number
}

export const NetworkSelectorContent = ({
  chainsToDisplay,
  selectedChainIds,
  isReadOnly,
  isAllChainsSelected,
  onChainToggle,
  onSelectAll,
  bottomInset,
  topInset,
}: NetworkSelectorContentProps) => {
  const isChainSelected = (chainId: string) => {
    return selectedChainIds.includes(chainId)
  }

  const shouldShowAllNetworksItem = !isReadOnly && isAllChainsSelected

  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: bottomInset + topInset + 100,
      }}
    >
      <>
        <AllNetworksItem
          isSelected={isAllChainsSelected}
          isReadOnly={isReadOnly}
          isVisible={shouldShowAllNetworksItem}
          onSelectAll={onSelectAll}
        />
        {chainsToDisplay.map((chain) => (
          <ChainItem
            key={chain.chainId}
            chain={chain}
            isSelected={isChainSelected(chain.chainId)}
            isReadOnly={isReadOnly}
            onToggle={onChainToggle}
          />
        ))}
      </>
    </BottomSheetScrollView>
  )
}
