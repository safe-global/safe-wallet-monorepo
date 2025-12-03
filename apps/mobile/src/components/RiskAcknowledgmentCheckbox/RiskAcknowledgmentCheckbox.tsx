import React from 'react'
import { Pressable } from 'react-native'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '../SafeFontIcon'

interface RiskAcknowledgmentCheckboxProps {
  checked: boolean
  onToggle: (checked: boolean) => void
  label: string
}

export const RiskAcknowledgmentCheckbox = ({ checked, onToggle, label }: RiskAcknowledgmentCheckboxProps) => {
  return (
    <Pressable onPress={() => onToggle(!checked)}>
      <View flexDirection="row" alignItems="center" gap="$3" paddingVertical="$2">
        <View
          width={20}
          height={20}
          borderWidth={1}
          borderColor={checked ? '$primary' : '$borderLight'}
          backgroundColor={checked ? '$primary' : 'transparent'}
          borderRadius={4}
          alignItems="center"
          justifyContent="center"
        >
          {checked && <SafeFontIcon name="check" size={12} color="#FFFFFF" />}
        </View>
        <Text fontSize="$4" color="$color" flex={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  )
}
