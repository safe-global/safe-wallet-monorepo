import React from 'react'
import { View } from 'tamagui'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Address } from '@/src/types/address'
import { HistoryTransactionBase } from './HistoryTransactionBase'

interface CancelTxProps {
  txInfo: CustomTransactionInfo
  executionInfo: MultisigExecutionDetails
  txId: string
}

export function CancelTx({ txId, txInfo, executionInfo }: CancelTxProps) {
  const recipientAddress = txInfo?.to?.value as Address

  return (
    <HistoryTransactionBase
      txId={txId}
      recipientAddress={recipientAddress}
      customLogo={
        <View borderRadius={100} padding="$2" backgroundColor="$errorDark">
          <SafeFontIcon color="$error" name="close-outlined" />
        </View>
      }
      badgeIcon="transaction-contract"
      badgeColor="$textSecondaryLight"
      transactionType={txInfo.methodName ?? 'On-chain rejection'}
      description={`This is an on-chain rejection that didn't send any funds. This on-chain rejection replaced all transactions with nonce ${executionInfo.nonce}.`}
    />
  )
}
