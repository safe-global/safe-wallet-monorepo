import React, { useCallback } from 'react'
import { Input, View, Text } from 'tamagui'
import { Pressable } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Identicon } from '@/src/components/Identicon'
import { shortenAddress } from '@/src/utils/formatters'
import { RecipientValidationBadge } from './RecipientValidationBadge'
import type { RecipientValidationState } from '../hooks/useRecipientValidation'
import type { Address } from '@/src/types/address'

interface RecipientInputProps {
  value: string
  onChangeText: (text: string) => void
  onClear: () => void
  validationState: RecipientValidationState
  contactName?: string
  selectedName?: string
}

const borderColors: Record<RecipientValidationState, string> = {
  empty: '$borderLight',
  typing: '$borderLight',
  known: '$success',
  unknown: '$info',
  invalid: '$error',
  'self-send': '$warning',
}

const labelConfig: Partial<Record<RecipientValidationState, { icon: string; color: string; text: string }>> = {
  known: { icon: 'check', color: '$success', text: 'Known recipient' },
  unknown: { icon: 'info', color: '$info', text: 'Unknown recipient' },
  invalid: { icon: 'alert', color: '$error', text: 'Invalid recipient' },
  'self-send': {
    icon: 'alert',
    color: '$warning',
    text: 'Sending to your own Safe',
  },
}

function RecipientLabel({ validationState }: { validationState: RecipientValidationState }) {
  const label = labelConfig[validationState]

  if (label) {
    return (
      <>
        <SafeFontIcon name={label.icon as 'check'} size={16} color={label.color} />
        <Text fontSize="$4" color={label.color}>
          {label.text}
        </Text>
      </>
    )
  }

  return (
    <>
      <SafeFontIcon name="send-to" size={16} color="$color" />
      <Text fontSize="$4" color="$color">
        Recipient
      </Text>
    </>
  )
}

function SelectedRecipient({
  value,
  selectedName,
  onClear,
}: {
  value: string
  selectedName: string
  onClear: () => void
}) {
  return (
    <>
      <View flex={1} flexDirection="row" alignItems="center" gap="$3">
        <Identicon address={value as Address} size={32} rounded />
        <View flex={1} gap={2}>
          <Text fontSize="$4" fontWeight={600} color="$color">
            {selectedName}
          </Text>
          <Text fontSize="$3" color="$colorSecondary">
            {shortenAddress(value, 6)}
          </Text>
        </View>
      </View>
      <Pressable onPress={onClear} hitSlop={12} testID="clear-recipient-button">
        <SafeFontIcon name="close" size={16} color="$colorSecondary" />
      </Pressable>
    </>
  )
}

function AddressInputField({
  value,
  hasAddress,
  onChangeText,
  onClear,
  onPaste,
}: {
  value: string
  hasAddress: boolean
  onChangeText: (text: string) => void
  onClear: () => void
  onPaste: () => void
}) {
  return (
    <>
      <View flex={1} flexDirection="row" alignItems="center" gap="$2">
        <Text fontSize="$4" color="$colorSecondary">
          To:
        </Text>
        {hasAddress ? (
          <Text fontSize="$4" color="$color" flex={1}>
            {value}
          </Text>
        ) : (
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
            padding={0}
            height="auto"
            backgroundColor="transparent"
            testID="recipient-input"
          />
        )}
      </View>
      {hasAddress ? (
        <Pressable onPress={onClear} hitSlop={12} testID="clear-recipient-button">
          <SafeFontIcon name="close" size={16} color="$colorSecondary" />
        </Pressable>
      ) : (
        <Pressable onPress={onPaste} testID="paste-button">
          <View
            borderWidth={1}
            borderColor="$borderLight"
            borderRadius={100}
            paddingHorizontal="$2"
            paddingVertical="$0.5"
          >
            <Text fontSize="$4" color="$colorSecondary">
              Paste
            </Text>
          </View>
        </Pressable>
      )}
    </>
  )
}

export function RecipientInput({
  value,
  onChangeText,
  onClear,
  validationState,
  contactName,
  selectedName,
}: RecipientInputProps) {
  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getString()
    if (text) {
      onChangeText(text.trim())
    }
  }, [onChangeText])

  const isSelected = !!selectedName && validationState !== 'empty' && validationState !== 'typing'
  const hasAddress = validationState !== 'empty' && validationState !== 'typing'

  return (
    <View gap="$2">
      <View flexDirection="row" alignItems="center" gap="$2">
        <RecipientLabel validationState={validationState} />
      </View>
      <View
        flexDirection="row"
        alignItems="center"
        borderWidth={1}
        borderColor={borderColors[validationState]}
        borderRadius={8}
        padding="$4"
        minHeight={64}
      >
        {isSelected ? (
          <SelectedRecipient value={value} selectedName={selectedName} onClear={onClear} />
        ) : (
          <AddressInputField
            value={value}
            hasAddress={hasAddress}
            onChangeText={onChangeText}
            onClear={onClear}
            onPaste={handlePaste}
          />
        )}
      </View>
      {!isSelected && !hasAddress && <RecipientValidationBadge state={validationState} contactName={contactName} />}
    </View>
  )
}
