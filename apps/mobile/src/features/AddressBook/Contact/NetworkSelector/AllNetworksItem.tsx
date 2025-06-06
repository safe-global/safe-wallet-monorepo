import React from 'react'
import { TouchableOpacity } from 'react-native'
import { View } from 'tamagui'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface AllNetworksItemProps {
  isSelected: boolean
  isReadOnly: boolean
  isVisible: boolean
  onSelectAll: () => void
}

export const AllNetworksItem = ({ isSelected, isReadOnly, isVisible, onSelectAll }: AllNetworksItemProps) => {
  if (!isVisible) {
    return null
  }

  return (
    <TouchableOpacity style={{ width: '100%' }} onPress={onSelectAll} disabled={isReadOnly}>
      <View
        backgroundColor={isSelected ? '$borderLight' : '$backgroundTransparent'}
        borderRadius="$4"
        marginBottom="$2"
      >
        <AssetsCard
          name="All Networks"
          description="Contact available on all supported networks"
          rightNode={isSelected && <SafeFontIcon name="check" color="$color" />}
        />
      </View>
    </TouchableOpacity>
  )
}
