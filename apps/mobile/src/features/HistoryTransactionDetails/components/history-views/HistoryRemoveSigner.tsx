import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, H3 } from 'tamagui'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { HashDisplay } from '@/src/components/HashDisplay'
import { ThresholdChangeDisplay, NetworkDisplay } from '../shared'

interface HistoryRemoveSignerProps {
  txId: string
  txInfo: NormalizedSettingsChangeTransaction
  executionInfo: MultisigExecutionDetails
  executedAt: number
}

export function HistoryRemoveSigner({ txId, txInfo, executionInfo, executedAt }: HistoryRemoveSignerProps) {
  return (
    <>
      <TransactionHeader
        logo={txInfo.settingsInfo?.owner?.value}
        isIdenticon
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={<H3 fontWeight={600}>Remove signer</H3>}
        submittedAt={executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            <View alignItems="center" flexDirection="row" justifyContent="space-between">
              <Text color="$textSecondaryLight">Removed signer</Text>
              <View flexDirection="row" alignItems="center" gap="$2">
                <HashDisplay value={txInfo.settingsInfo?.owner?.value} />
              </View>
            </View>

            <ThresholdChangeDisplay txInfo={txInfo} executionInfo={executionInfo} />

            <NetworkDisplay />

            <HistoryAdvancedDetailsButton txId={txId} />
          </Container>
        </YStack>
      </View>
    </>
  )
}
