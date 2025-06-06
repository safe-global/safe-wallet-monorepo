import React, { useRef, useEffect } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { getVariable, useTheme } from 'tamagui'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, useGetChainsConfigQuery, getChainsByIds } from '@/src/store/chains'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NetworkSelectorHeader } from './NetworkSelectorHeader'
import { NetworkSelectorContent } from './NetworkSelectorContent'

interface NetworkSelectorProps {
  isVisible: boolean
  onClose: () => void
  onSelectionChange: (chainIds: string[]) => void
  selectedChainIds: string[]
  isReadOnly?: boolean
}

export const NetworkSelector = ({
  isVisible,
  onClose,
  onSelectionChange,
  selectedChainIds,
  isReadOnly = false,
}: NetworkSelectorProps) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const theme = useTheme()

  // Fetch chains data to ensure it's up to date
  useGetChainsConfigQuery()

  const allChains = useAppSelector(selectAllChains) || []
  const selectedChains = useAppSelector((state) => getChainsByIds(state, selectedChainIds))

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [isVisible])

  const handleChainToggle = (chainId: string) => {
    if (isReadOnly) {
      return
    }

    let newSelection: string[]

    if (selectedChainIds.includes(chainId)) {
      newSelection = selectedChainIds.filter((id) => id !== chainId)
    } else {
      newSelection = [...selectedChainIds, chainId]
    }

    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (isReadOnly) {
      return
    }
    onSelectionChange([]) // Empty array means all chains
  }

  const isAllChainsSelected = selectedChainIds.length === 0
  const chainsToDisplay = isReadOnly ? (isAllChainsSelected ? allChains : selectedChains) : allChains

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      backgroundComponent={BackgroundComponent}
      backdropComponent={() => <BackdropComponent shouldNavigateBack={false} />}
      topInset={insets.top}
      bottomInset={insets.bottom}
      enableDynamicSizing
      handleIndicatorStyle={{ backgroundColor: getVariable(theme.borderMain) }}
      onDismiss={onClose}
    >
      <NetworkSelectorHeader
        isReadOnly={isReadOnly}
        isAllChainsSelected={isAllChainsSelected}
        selectedChainCount={selectedChainIds.length}
      />

      <NetworkSelectorContent
        chainsToDisplay={chainsToDisplay}
        selectedChainIds={selectedChainIds}
        isReadOnly={isReadOnly}
        isAllChainsSelected={isAllChainsSelected}
        onChainToggle={handleChainToggle}
        onSelectAll={handleSelectAll}
        bottomInset={insets.bottom}
        topInset={insets.top}
      />
    </BottomSheetModal>
  )
}
