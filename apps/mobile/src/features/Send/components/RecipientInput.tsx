import React, { useCallback } from 'react'
import { Input, View, Text } from 'tamagui'
import { Pressable } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { RecipientValidationBadge } from './RecipientValidationBadge'
import type { RecipientValidationState } from '../hooks/useRecipientValidation'

interface RecipientInputProps {
  value: string
  onChangeText: (text: string) => void
  validationState: RecipientValidationState
  contactName?: string
}

const borderColors: Record<RecipientValidationState, string> = {
  empty: '$borderLight',
  typing: '$borderLight',
  known: '$success',
  unknown: '$info',
  invalid: '$error',
  'self-send': '$warning',
}

export function RecipientInput({ value, onChangeText, validationState, contactName }: RecipientInputProps) {
  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getString()
    if (text) {
      onChangeText(text.trim())
    }
  }, [onChangeText])

  return (
    <View gap="$2">
      <View flexDirection="row" alignItems="center" gap="$2">
        <SafeFontIcon name="send-to" size={16} color="$colorSecondary" />
        <Text fontSize="$4" color="$colorSecondary">
          Recipient address
        </Text>
      </View>
      <View
        flexDirection="row"
        alignItems="center"
        borderWidth={1}
        borderColor={borderColors[validationState]}
        borderRadius={8}
        paddingHorizontal="$4"
        minHeight={64}
      >
        <View flex={1} flexDirection="row" alignItems="baseline" gap="$2">
          <Text fontSize="$4" color="$colorSecondary">
            To:
          </Text>
          <Input
            flex={1}
            value={value}
            onChangeText={onChangeText}
            placeholder="Wallet address or ENS"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            autoCorrect={false}
            fontSize="$4"
            borderWidth={0}
            paddingHorizontal={0}
            backgroundColor="transparent"
            testID="recipient-input"
          />
        </View>
        <Pressable onPress={handlePaste} testID="paste-button">
          <View
            borderWidth={1}
            borderColor="$borderLight"
            borderRadius={100}
            paddingHorizontal="$2"
            paddingVertical={2}
          >
            <Text fontSize="$4" color="$colorSecondary">
              Paste
            </Text>
          </View>
        </Pressable>
      </View>
      <RecipientValidationBadge state={validationState} contactName={contactName} />
    </View>
  )
}
