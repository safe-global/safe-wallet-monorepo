import React from 'react'
import { Container } from '@/src/components/Container'
import { View, YStack, Text, H3 } from 'tamagui'
import { TransactionHeader } from '@/src/features/ConfirmTx/components/TransactionHeader'
import {
  TransactionData,
  Transaction,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { Address } from '@/src/types/address'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'
import { useTransactionType } from '@/src/hooks/useTransactionType'
import { HashDisplay } from '@/src/components/HashDisplay'
import { NetworkDisplay } from '../shared'

interface HistoryGenericViewProps {
  txId: string
  txInfo: TransactionDetails['txInfo']
  txData: TransactionData
  executedAt: number
}

export function HistoryGenericView({ txId, txInfo, txData, executedAt }: HistoryGenericViewProps) {
  const recipientAddress = txData?.to?.value as Address

  // Create a transaction object for the hook - need full Transaction type
  const transaction: Transaction = {
    id: txId,
    timestamp: executedAt,
    txInfo,
    txStatus: 'SUCCESS',
    executionInfo: null,
    safeAppInfo: null,
  } as Transaction

  // Get transaction type information for display
  const txType = useTransactionType(transaction)
  const transactionLabel = txType.text || 'Transaction'

  return (
    <>
      <TransactionHeader
        badgeIcon="transaction-contract"
        badgeColor="$textSecondaryLight"
        title={<H3 fontWeight={600}>{transactionLabel}</H3>}
        submittedAt={executedAt}
      />

      <View>
        <YStack gap="$4" marginTop="$8">
          <Container padding="$4" gap="$4" borderRadius="$3">
            {recipientAddress && (
              <View alignItems="center" flexDirection="row" justifyContent="space-between">
                <Text color="$textSecondaryLight">To</Text>

                <HashDisplay value={recipientAddress} />
              </View>
            )}

            <NetworkDisplay />

            <HistoryAdvancedDetailsButton txId={txId} />
          </Container>
        </YStack>
      </View>
    </>
  )
}
