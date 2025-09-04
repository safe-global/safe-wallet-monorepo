import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack } from 'tamagui'
import { HistoryTransactionHeader } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionHeader'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ThresholdChangeDisplay, NetworkDisplay } from '../shared'

interface HistoryChangeThresholdProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function HistoryChangeThreshold({ txId, txInfo, executionInfo }: HistoryChangeThresholdProps) {
  return (
    <>
      <HistoryTransactionHeader
        customLogo={
          <View borderRadius={100} padding="$2" backgroundColor="$backgroundSecondary">
            <SafeFontIcon color="$primary" name="owners" />
          </View>
        }
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        transactionType="Threshold change"
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <ThresholdChangeDisplay txInfo={txInfo} executionInfo={executionInfo} />

            <NetworkDisplay />

            <HistoryAdvancedDetailsButton txId={txId} />
          </Container>
        </YStack>
      </View>
    </>
  )
}
