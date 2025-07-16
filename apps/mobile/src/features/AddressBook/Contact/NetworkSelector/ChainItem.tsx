import React from 'react'
import { TouchableOpacity } from 'react-native'
import { View } from 'tamagui'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface ChainItemProps {
  chain: Chain
  isSelected: boolean
  isReadOnly: boolean
  onToggle: (chainId: string) => void
}

export const ChainItem = ({ chain, isSelected, isReadOnly, onToggle }: ChainItemProps) => {
  const handlePress = () => {
    onToggle(chain.chainId)
  }

  return (
    <TouchableOpacity key={chain.chainId} style={{ width: '100%' }} onPress={handlePress} disabled={isReadOnly}>
      <View
        backgroundColor={isSelected ? '$borderLight' : '$backgroundTransparent'}
        borderRadius="$4"
        marginBottom="$2"
      >
        <AssetsCard
          name={chain.chainName}
          logoUri={chain.chainLogoUri}
          rightNode={!isReadOnly && isSelected && <SafeFontIcon name="check" color="$color" />}
        />
      </View>
    </TouchableOpacity>
  )
}
