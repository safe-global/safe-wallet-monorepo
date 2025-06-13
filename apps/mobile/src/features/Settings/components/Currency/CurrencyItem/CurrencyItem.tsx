import React from 'react'
import { View, Text } from 'tamagui'
import { Pressable } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import type { CurrencyItemProps } from '../Currency.types'

export const CurrencyItem: React.FC<CurrencyItemProps> = ({ code, symbol, name, isSelected, onPress }) => (
  <Pressable onPress={onPress}>
    <View borderRadius="$2">
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <View flex={1}>
          <Text fontSize="$5" fontWeight="600" color="$color">
            {code} - {symbol}
          </Text>
          <Text fontSize="$4" color="$colorSecondary">
            {name}
          </Text>
        </View>
        {isSelected && <SafeFontIcon name="check" size={24} color="$color" />}
      </View>
    </View>
  </Pressable>
)
