import React from 'react'
import { Input, View, Text } from 'tamagui'
import { Pressable } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { RecipientValidationBadge } from './RecipientValidationBadge'
import type { RecipientValidationState } from '../hooks/useRecipientValidation'

interface RecipientInputProps {
  value: string
  onChangeText: (text: string) => void
  onQrPress: () => void
  validationState: RecipientValidationState
  contactName?: string
}

const borderColors: Record<RecipientValidationState, string> = {
  empty: '$borderMain',
  typing: '$borderMain',
  known: '$success',
  unknown: '$info',
  invalid: '$error',
  'self-send': '$warning',
}

export function RecipientInput({ value, onChangeText, onQrPress, validationState, contactName }: RecipientInputProps) {
  return (
    <View gap="$2">
      <Text fontSize="$3" fontWeight={600} color="$color">
        Recipient address
      </Text>
      <View
        flexDirection="row"
        alignItems="center"
        borderWidth={1}
        borderColor={borderColors[validationState]}
        borderRadius="$3"
        paddingHorizontal="$3"
        backgroundColor="$background"
      >
        <Input
          flex={1}
          value={value}
          onChangeText={onChangeText}
          placeholder="Enter address or paste"
          placeholderTextColor="$colorSecondary"
          autoCapitalize="none"
          autoCorrect={false}
          fontSize="$3"
          borderWidth={0}
          paddingHorizontal={0}
          testID="recipient-input"
        />
        <Pressable onPress={onQrPress} testID="qr-scan-button">
          <SafeFontIcon name="qr-code" size={20} color="$colorSecondary" />
        </Pressable>
      </View>
      <RecipientValidationBadge state={validationState} contactName={contactName} />
    </View>
  )
}
