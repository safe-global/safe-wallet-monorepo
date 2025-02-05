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
    <View
      alignItems="center"
      testID="dropdown-label-view"
      onPress={onPress}
      flexDirection="row"
      marginBottom="$3"
      columnGap="$2"
    >
      {leftNode}

      <Text fontSize={labelProps.fontSize} fontWeight={labelProps.fontWeight}>
        {label}
      </Text>

      <SafeFontIcon testID="dropdown-arrow" name="arrow-down" />
    </View>
  )
}
