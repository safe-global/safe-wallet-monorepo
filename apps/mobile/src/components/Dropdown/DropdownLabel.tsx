import React from 'react'
import { GetThemeValueForKey, Text, View } from 'tamagui'
import { Pressable } from 'react-native-gesture-handler'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

type DropdownLabelProps = {
  label: string
  subtitle?: string
  leftNode?: React.ReactNode
  labelProps?: {
    fontSize?: '$4' | '$5' | GetThemeValueForKey<'fontSize'>
    fontWeight: 400 | 500 | 600
  }
  displayDropDownIcon?: boolean
  onPress?: () => void
  hitSlop?: number
}
const defaultLabelProps = {
  fontSize: '$4',
  fontWeight: 400,
} as const

export const DropdownLabel = ({
  label,
  subtitle,
  displayDropDownIcon = true,
  leftNode,
  onPress,
  labelProps = defaultLabelProps,
  hitSlop = 0,
}: DropdownLabelProps) => {
  return (
    <Pressable testID="dropdown-label-view" onPress={onPress} hitSlop={hitSlop}>
      <View flexDirection="row" columnGap="$2" justifyContent="space-between" alignItems="center">
        {leftNode}

        <View justifyContent={'center'}>
          <View flexDirection="row" alignItems="center" columnGap="$1">
            <Text fontSize={labelProps.fontSize} fontWeight={labelProps.fontWeight} numberOfLines={1} maxWidth={170}>
              {label}
            </Text>

            {displayDropDownIcon && <SafeFontIcon testID="dropdown-arrow" name="chevron-down" size={16} />}
          </View>

          {subtitle && (
            <Text fontSize="$4" color="$colorSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  )
}
