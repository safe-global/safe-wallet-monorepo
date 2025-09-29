import React from 'react'
import { View, Text } from 'tamagui'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'

interface ThresholdChangeDisplayProps {
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function ThresholdChangeDisplay({ txInfo, executionInfo }: ThresholdChangeDisplayProps) {
  const hasThresholdChanged = txInfo.settingsInfo?.threshold !== executionInfo.confirmationsRequired

  if (!hasThresholdChanged) {
    return null
  }

  return (
    <View alignItems="center" flexDirection="row" justifyContent="space-between">
      <Text color="$textSecondaryLight">Threshold change</Text>
      <View flexDirection="row" alignItems="center" gap="$2">
        <Text fontSize="$4">
          {txInfo.settingsInfo?.threshold}/{executionInfo.signers.length}
        </Text>
        <Text textDecorationLine="line-through" color="$textSecondaryLight" fontSize="$4">
          {executionInfo.confirmationsRequired}/{executionInfo.signers.length}
        </Text>
      </View>
    </View>
  )
}
