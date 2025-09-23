import React from 'react'
import { TouchableOpacity } from 'react-native'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import { EthAddress } from '@/src/components/EthAddress'
import { useTheme } from '@/src/theme/hooks/useTheme'

export interface AddressItemData {
  address: string
  path: string
  index: number
  isSelected: boolean
}

interface AddressItemProps {
  item: AddressItemData
  onSelect: (address: AddressItemData) => void
  isFirst?: boolean
  isLast?: boolean
}

export const AddressItem = ({ item, onSelect, isFirst = false, isLast = false }: AddressItemProps) => {
  const { isDark } = useTheme()

  const topRadius = isFirst ? '$4' : undefined
  const bottomRadius = isLast ? '$4' : undefined
  return (
    <View position="relative">
      <TouchableOpacity onPress={() => onSelect(item)} testID={`address-item-${item.index}`}>
        <View
          backgroundColor={isDark ? '$backgroundPaper' : '$background'}
          borderTopRightRadius={topRadius}
          borderTopLeftRadius={topRadius}
          borderBottomRightRadius={bottomRadius}
          borderBottomLeftRadius={bottomRadius}
          paddingVertical="$4"
          paddingHorizontal="$4"
        >
          <View flexDirection="row" alignItems="flex-start" gap="$3">
            {/* Identicon on the left */}
            <View width="$10">
              <Identicon address={item.address as `0x${string}`} size={40} />
            </View>

            {/* Address and path in the middle */}
            <View flex={1}>
              <EthAddress
                address={item.address as `0x${string}`}
                textProps={{ fontSize: '$4', fontWeight: 600, lineHeight: 20 }}
              />
              <Text fontSize="$3" color="$colorSecondary" lineHeight={16} marginTop="$1">
                {item.path}
              </Text>
            </View>

            {/* Checkbox on the right */}
            <View alignItems="center" justifyContent="center" height="$10">
              {item.isSelected ? (
                <SafeFontIcon name="check" size={20} color="$primary" />
              ) : (
                <View width={20} height={20} borderRadius="$2" borderWidth={2} borderColor="$borderLight" />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}
