import React from 'react'
import {
  TransactionData,
  Transaction,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Address } from '@/src/types/address'
import { useTransactionType } from '@/src/hooks/useTransactionType'
import { HistoryTransactionBase } from './HistoryTransactionBase'

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
    <HistoryTransactionBase
      txId={txId}
      recipientAddress={recipientAddress}
      badgeIcon="transaction-contract"
      badgeColor="$textSecondaryLight"
      transactionType={transactionLabel}
    />
  )
}
