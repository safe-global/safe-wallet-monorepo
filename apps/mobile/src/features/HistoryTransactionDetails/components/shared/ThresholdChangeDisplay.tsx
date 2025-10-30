import React from 'react'
import { Text, XStack } from 'tamagui'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { InfoSheet } from '@/src/components/InfoSheet'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

interface ThresholdChangeDisplayProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function ThresholdChangeDisplay({ txInfo, executionInfo }: ThresholdChangeDisplayProps) {
  const hasThresholdChanged = txInfo.settingsInfo?.threshold !== executionInfo.confirmationsRequired

  if (!hasThresholdChanged) {
    return (
      <XStack alignItems="center" justifyContent="space-between">
        <InfoSheet info="Confirmations required for new transactions">
          <XStack alignItems="center" gap="$1">
            <Text color="$textSecondaryLight">Confirmations</Text>
            <SafeFontIcon name="info" size={16} color="$textSecondaryLight" />
          </XStack>
        </InfoSheet>
        <XStack alignItems="center" gap="$2">
          <Text fontSize="$4" testID="threshold-change-display-threshold">
            {txInfo.settingsInfo?.threshold}
          </Text>
        </XStack>
      </XStack>
    )
  }

  return (
    <XStack alignItems="center" justifyContent="space-between">
      <Text color="$textSecondaryLight">Threshold change</Text>
      <XStack alignItems="center" gap="$2">
        <Text fontSize="$4">
          {txInfo.settingsInfo?.threshold}/{executionInfo.signers.length}
        </Text>
        <Text textDecorationLine="line-through" color="$textSecondaryLight" fontSize="$4">
          {executionInfo.confirmationsRequired}/{executionInfo.signers.length}
        </Text>
      </XStack>
    </XStack>
  )
}
