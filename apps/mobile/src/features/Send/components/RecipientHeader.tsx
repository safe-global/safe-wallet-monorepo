import React from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { shortenAddress } from '@/src/utils/formatters'

interface RecipientHeaderProps {
  recipientAddress: string
  recipientName?: string
  displayNonce: number | undefined
  onRecipientPress: () => void
  onNoncePress: () => void
}

function RecipientDisplay({ recipientAddress, recipientName }: { recipientAddress: string; recipientName?: string }) {
  if (recipientName) {
    return (
      <View gap={2}>
        <Text fontSize="$4" fontWeight={600} color="$color">
          {recipientName}
        </Text>
        <Text fontSize="$3" color="$colorSecondary">
          {shortenAddress(recipientAddress, 4)}
        </Text>
      </View>
    )
  }

  return (
    <Text fontSize="$4" color="$color">
      {shortenAddress(recipientAddress, 6)}
    </Text>
  )
}

export function RecipientHeader({
  recipientAddress,
  recipientName,
  displayNonce,
  onRecipientPress,
  onNoncePress,
}: RecipientHeaderProps) {
  return (
    <View paddingHorizontal="$4" paddingTop="$3" flexDirection="row" gap="$2">
      <View flex={1} gap="$2">
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="send-to" size={16} color="$color" />
          <Text fontSize="$4" color="$color">
            Recipient
          </Text>
        </View>
        <Pressable onPress={onRecipientPress} testID="recipient-summary">
          <View
            flexDirection="row"
            alignItems="center"
            backgroundColor="$backgroundSkeleton"
            borderRadius={8}
            paddingHorizontal="$4"
            height={64}
            gap="$2"
          >
            <Text fontSize="$4" color="$colorSecondary">
              To:
            </Text>
            <RecipientDisplay recipientAddress={recipientAddress} recipientName={recipientName} />
          </View>
        </Pressable>
      </View>

      <View gap="$2" minWidth={100}>
        <View flexDirection="row" alignItems="center" gap="$2">
          <SafeFontIcon name="apps" size={16} color="$color" />
          <Text fontSize="$4" color="$color">
            Nonce
          </Text>
        </View>
        <Pressable onPress={onNoncePress} testID="nonce-display">
          <View
            alignItems="center"
            justifyContent="center"
            backgroundColor="$backgroundSkeleton"
            borderRadius={8}
            paddingHorizontal="$4"
            height={64}
          >
            <Text fontSize="$4" color="$color">
              {displayNonce !== undefined ? `# ${displayNonce}` : '\u2014'}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  )
}
