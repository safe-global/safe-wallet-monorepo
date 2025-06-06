import React from 'react'
import { Text, View } from 'tamagui'

interface NetworkSelectorHeaderProps {
  isReadOnly: boolean
  isAllChainsSelected: boolean
  selectedChainCount: number
}

export const NetworkSelectorHeader = ({
  isReadOnly,
  isAllChainsSelected,
  selectedChainCount,
}: NetworkSelectorHeaderProps) => {
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
      return `Contact is available on ${selectedChainCount} network${selectedChainCount === 1 ? '' : 's'}`
    }

    if (isAllChainsSelected) {
      return 'Contact available on all networks'
    }
    return `Contact available on ${selectedChainCount} network${selectedChainCount === 1 ? '' : 's'}`
  }

  return (
    <View alignItems="center" paddingHorizontal="$4" paddingVertical="$4">
      <Text fontSize="$6" fontWeight="600" color="$color">
        {getTitle()}
      </Text>
      <Text fontSize="$3" color="$colorSecondary" textAlign="center" marginTop="$2">
        {getSubtitle()}
      </Text>
    </View>
  )
}
