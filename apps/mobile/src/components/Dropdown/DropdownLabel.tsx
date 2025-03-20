import React from 'react'
import { GetThemeValueForKey, Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

type DropdownLabelProps = {
  label: string
  leftNode?: React.ReactNode
  labelProps?: {
    fontSize?: '$4' | '$5' | GetThemeValueForKey<'fontSize'>
    fontWeight: 400 | 500 | 600
  }
  onPress?: () => void
}
const defaultLabelProps = {
  fontSize: '$4',
  fontWeight: 400,
} as const

export const DropdownLabel = ({ label, leftNode, onPress, labelProps = defaultLabelProps }: DropdownLabelProps) => {
  return (
    <View testID="dropdown-label-view" onPress={onPress} flexDirection="row" columnGap="$2">
      {leftNode}

      <View justifyContent={'center'}>
        <Text fontSize={labelProps.fontSize} fontWeight={labelProps.fontWeight} numberOfLines={1} maxWidth={170}>
          {label}
        </Text>
      </View>

      <View paddingTop={'$1'}>
        <SafeFontIcon testID="dropdown-arrow" name="chevron-down" size={16} />
      </View>
    </View>
  )
}
