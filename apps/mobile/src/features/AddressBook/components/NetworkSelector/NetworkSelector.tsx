import React, { useRef, useEffect } from 'react'
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { getVariable, Text, View, useTheme } from 'tamagui'
import { TouchableOpacity } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains, useGetChainsConfigQuery, getChainsByIds } from '@/src/store/chains'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { BackdropComponent, BackgroundComponent } from '@/src/components/Dropdown/sheetComponents'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface NetworkSelectorProps {
  isVisible: boolean
  onClose: () => void
  onSelectionChange: (chainIds: string[]) => void
  selectedChainIds: string[]
  isReadOnly?: boolean // New prop for view-only mode
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
      return // Don't allow changes in read-only mode
    }

    let newSelection: string[]

    if (selectedChainIds.includes(chainId)) {
      // Remove chain
      newSelection = selectedChainIds.filter((id) => id !== chainId)
    } else {
      // Add chain
      newSelection = [...selectedChainIds, chainId]
    }

    onSelectionChange(newSelection)
  }

  const isChainSelected = (chainId: string) => {
    return selectedChainIds.includes(chainId)
  }

  const isAllChainsSelected = selectedChainIds.length === 0

  const handleSelectAll = () => {
    if (isReadOnly) {
      return // Don't allow changes in read-only mode
    }
    onSelectionChange([]) // Empty array means all chains
  }

  // Determine which chains to display
  const chainsToDisplay = isReadOnly ? (isAllChainsSelected ? allChains : selectedChains) : allChains

  const renderChainItem = (chain: Chain) => {
    const isSelected = isChainSelected(chain.chainId)

    return (
      <TouchableOpacity
        key={chain.chainId}
        style={{ width: '100%' }}
        onPress={() => handleChainToggle(chain.chainId)}
        disabled={isReadOnly}
      >
        <View
          backgroundColor={isSelected ? '$borderLight' : '$backgroundTransparent'}
          borderRadius="$4"
          marginBottom="$2"
        >
          <AssetsCard
            name={chain.chainName}
            logoUri={chain.chainLogoUri}
            description={chain.description || `Chain ID: ${chain.chainId}`}
            rightNode={!isReadOnly && isSelected && <SafeFontIcon name="check" color="$color" />}
          />
        </View>
      </TouchableOpacity>
    )
  }

  const renderAllChainsItem = () => {
    // Only show "All Networks" option in edit mode and when all chains are selected
    if (isReadOnly || !isAllChainsSelected) {
      return null
    }

    return (
      <TouchableOpacity style={{ width: '100%' }} onPress={handleSelectAll}>
        <View
          backgroundColor={isAllChainsSelected ? '$borderLight' : '$backgroundTransparent'}
          borderRadius="$4"
          marginBottom="$2"
        >
          <AssetsCard
            name="All Networks"
            description="Contact available on all supported networks"
            rightNode={isAllChainsSelected && <SafeFontIcon name="check" color="$color" />}
          />
        </View>
      </TouchableOpacity>
    )
  }

  const getTitle = () => {
    if (isReadOnly) {
      return 'Available Networks'
    }
    return 'Select Networks'
  }

  const getSubtitle = () => {
    if (isReadOnly) {
      if (isAllChainsSelected) {
        return 'Contact is available on all networks'
      }
      return `Contact is available on ${selectedChainIds.length} network${selectedChainIds.length === 1 ? '' : 's'}`
    }

    if (isAllChainsSelected) {
      return 'Contact available on all networks'
    }
    return `Contact available on ${selectedChainIds.length} network${selectedChainIds.length === 1 ? '' : 's'}`
  }

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
      {/* Header */}
      <View alignItems="center" paddingHorizontal="$4" paddingVertical="$4">
        <Text fontSize="$6" fontWeight="600" color="$color">
          {getTitle()}
        </Text>
        <Text fontSize="$3" color="$colorSecondary" textAlign="center" marginTop="$2">
          {getSubtitle()}
        </Text>
      </View>

      {/* Content */}
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + insets.top + 100,
        }}
      >
        <>
          {renderAllChainsItem()}
          {chainsToDisplay.map((chain) => renderChainItem(chain))}
        </>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
