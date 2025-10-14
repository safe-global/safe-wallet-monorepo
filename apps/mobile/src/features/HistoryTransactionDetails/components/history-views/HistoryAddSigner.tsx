import React from 'react'
import { Container } from '@/src/components/Container'
import { YStack, Text, XStack } from 'tamagui'
import { HistoryTransactionHeader } from '@/src/features/HistoryTransactionDetails/components/HistoryTransactionHeader'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { HashDisplay } from '@/src/components/HashDisplay'
import { ThresholdChangeDisplay, NetworkDisplay } from '../shared'

interface HistoryAddSignerProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
}

export function HistoryAddSigner({ txId, txInfo, executionInfo }: HistoryAddSignerProps) {
  return (
    <>
      <HistoryTransactionHeader
        logo={txInfo.settingsInfo?.owner?.value}
        isIdenticon
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        transactionType="Add signer"
      />

      <YStack gap="$4" marginTop="$8">
        <Container padding="$4" gap="$4" borderRadius="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <Text color="$textSecondaryLight">New signer</Text>
            <XStack alignItems="center" gap="$2">
              <HashDisplay value={txInfo.settingsInfo?.owner?.value} />
            </XStack>
          </XStack>

          <ThresholdChangeDisplay txInfo={txInfo} executionInfo={executionInfo} />

          <NetworkDisplay />

          <HistoryAdvancedDetailsButton txId={txId} />
        </Container>
      </YStack>
    </>
  )
}
