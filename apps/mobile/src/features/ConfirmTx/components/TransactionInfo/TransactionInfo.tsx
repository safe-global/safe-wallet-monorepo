import React from 'react'
import { YStack } from 'tamagui'
import { MultisigExecutionDetails, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionChecks } from '../TransactionChecks'
import { ConfirmationsInfo } from '../ConfirmationsInfo'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { PendingTx } from '@/src/store/pendingTxsSlice'
import { PendingTxInfo } from '@/src/features/ConfirmTx/components/PendingTxInfo'

export function TransactionInfo({
  detailedExecutionInfo,
  txId,
  txDetails,
  pendingTx,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
  txDetails?: TransactionDetails
  pendingTx?: PendingTx
}) {
  let createdAt = null
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    createdAt = detailedExecutionInfo.submittedAt
  }

  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      {pendingTx && <PendingTxInfo createdAt={createdAt} pendingTx={pendingTx} />}

      {!pendingTx && <TransactionChecks txId={txId} txDetails={txDetails} />}

      <ConfirmationsInfo detailedExecutionInfo={detailedExecutionInfo} txId={txId} />
    </YStack>
  )
}
