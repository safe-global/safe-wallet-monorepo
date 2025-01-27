import React from 'react'
import { TouchableOpacity } from 'react-native'
import { styled, Text, View } from 'tamagui'

interface SafeButtonProps {
  onPress: () => void
  label: string
  variant?: 'primary' | 'secondary'
}

export const StyledButtonWrapper = styled(View, {
  height: 48,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
})

export function SafeButton({ onPress, label, variant = 'primary' }: SafeButtonProps) {
  const variantStyles =
    variant === 'primary'
      ? { backgroundColor: '$primary', fontColor: '$background' }
      : { backgroundColor: 'inherit', fontColor: '$primary' }
  return (
    <TouchableOpacity onPress={onPress}>
      <StyledButtonWrapper backgroundColor={variantStyles.backgroundColor}>
        <Text fontSize="$4" fontWeight={600} color={variantStyles.fontColor}>
          {label}
        </Text>
      </StyledButtonWrapper>
    </TouchableOpacity>
  )
}
