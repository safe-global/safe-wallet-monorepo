import React from 'react'
import { Container } from '@/src/components/Container'
import { YStack, Text, XStack, View } from 'tamagui'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { HashDisplay } from '@/src/components/HashDisplay'
import { NetworkDisplay } from '../shared'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SettingsChangeSwapOwner } from '@/src/utils/transaction-guards'
import { Identicon } from '@/src/components/Identicon'
import { type Address } from '@/src/types/address'

interface HistorySwapSignerProps {
  txId: string
  txInfo: SettingsChangeSwapOwner
}

export function HistorySwapSigner({ txId, txInfo }: HistorySwapSignerProps) {
  const oldOwnerAddress = txInfo.settingsInfo?.oldOwner?.value as Address
  const newOwnerAddress = txInfo.settingsInfo?.newOwner?.value as Address

  return (
    <>
      {/* Custom header with two identicons and update icon */}
      <YStack gap="$2" paddingHorizontal="$6" paddingTop="$4" alignItems="center">
        <XStack alignItems="center" justifyContent="center" gap="$2">
          {/* Old owner identicon */}
          <Identicon address={oldOwnerAddress} size={40} />

          {/* Arrow line */}
          <XStack width={8} alignItems="center" justifyContent="space-between">
            <View width={2} height={1} backgroundColor="$borderMain" />
            <View width={2} height={1} backgroundColor="$borderMain" />
          </XStack>
          {/* Update icon */}
          <SafeFontIcon name="update" size={16} color="$textSecondaryLight" />

          {/* Arrow line */}
          <XStack width={8} alignItems="center" justifyContent="space-between">
            <View width={2} height={1} backgroundColor="$borderMain" />
            <View width={2} height={1} backgroundColor="$borderMain" />
          </XStack>

          {/* New owner identicon with border */}
          <View borderWidth={2} borderColor="$backgroundMain" borderRadius={100}>
            <Identicon address={newOwnerAddress} size={40} />
          </View>
        </XStack>

        <Text color="$textSecondaryLight" fontSize="$4">
          Swap signer
        </Text>
      </YStack>

      <YStack gap="$4" marginTop="$8">
        <Container padding="$4" gap="$4" borderRadius="$3">
          {/* New signer row */}
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$textSecondaryLight">New signer</Text>
            <XStack alignItems="center" gap="$2">
              <HashDisplay value={newOwnerAddress} />
            </XStack>
          </XStack>

          {/* Old signer row */}
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$textSecondaryLight">Old signer</Text>
            <XStack alignItems="center" gap="$2">
              <HashDisplay value={oldOwnerAddress} />
            </XStack>
          </XStack>

          <NetworkDisplay />

          <HistoryAdvancedDetailsButton txId={txId} />
        </Container>
      </YStack>
    </>
  )
}
