import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, H3 } from 'tamagui'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { ThresholdChangeDisplay, NetworkDisplay } from '../shared'

interface HistoryChangeThresholdProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function HistoryChangeThreshold({ txId, txInfo, executionInfo, executedAt }: HistoryChangeThresholdProps) {
  return (
    <>
      <TransactionHeader
        customLogo={
          <View borderRadius={100} padding="$2" backgroundColor="$backgroundSecondary">
            <SafeFontIcon color="$primary" name="owners" />
          </View>
        }
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={<H3 fontWeight={600}>Threshold change</H3>}
        submittedAt={executedAt}
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
