import React from 'react'
import { Text, View, Theme } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Pressable, Keyboard } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { getChainsByIds } from '@/src/store/chains'

interface ContactNetworkRowProps {
  onPress: () => void
  chainIds: string[]
}

export const ContactNetworkRow = ({ onPress, chainIds }: ContactNetworkRowProps) => {
  const selectedChains = useAppSelector((state) => getChainsByIds(state, chainIds))

  const getDisplayText = () => {
    if (chainIds.length === 0) {
      return 'All Networks'
    }
    if (chainIds.length === 1) {
      return selectedChains[0]?.chainName || 'Unknown Network'
    }
    return `${chainIds.length} Networks`
  }

  const handlePress = () => {
    Keyboard.dismiss()
    onPress()
  }

  return (
    <Theme name="input_with_label">
      <Pressable onPress={handlePress}>
        <View
          backgroundColor="$background"
          borderRadius={8}
          padding="$3"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text fontSize="$4" fontWeight="400" color="$colorSecondary">
              Network
            </Text>
          </View>
          <View flexDirection="row" alignItems="center" gap="$2">
            <Text fontSize="$4" fontWeight="400" color="$colorSecondary">
              {getDisplayText()}
            </Text>
            <SafeFontIcon name="chevron-right" color="$colorTransparent" size={16} />
          </View>
        </View>
      </Pressable>
    </Theme>
  )
}
