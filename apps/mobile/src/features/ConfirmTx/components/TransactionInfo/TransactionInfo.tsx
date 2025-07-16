import React from 'react'
import { YStack } from 'tamagui'
import { MultisigExecutionDetails, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionChecks } from '../TransactionChecks'
import { ConfirmationsInfo } from '../ConfirmationsInfo'

export function TransactionInfo({
  detailedExecutionInfo,
  txId,
  txDetails,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
  txDetails?: TransactionDetails
}) {
  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      <TransactionChecks txId={txId} txDetails={txDetails} />

      <ConfirmationsInfo detailedExecutionInfo={detailedExecutionInfo} txId={txId} />
    </YStack>
  )
}
