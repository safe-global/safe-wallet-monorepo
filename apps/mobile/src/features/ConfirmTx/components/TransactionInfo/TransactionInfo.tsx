import React from 'react'
import { YStack } from 'tamagui'
import { MultisigExecutionDetails, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionChecks } from '../TransactionChecks'
import { ConfirmationsInfo } from '../ConfirmationsInfo'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { PendingTx } from '@/src/store/pendingTxsSlice'
import { PendingTxInfo } from '@/src/features/ConfirmTx/components/PendingTxInfo'
import { SafeShieldWidget } from '@/src/features/SafeShield/components/SafeShieldWidget'
import useSafeTx from '@/src/hooks/useSafeTx'
import { useCounterpartyAnalysis, useThreatAnalysis } from '@/src/features/SafeShield/hooks'

export function TransactionInfo({
  detailedExecutionInfo,
  txId,
  txDetails,
  pendingTx,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
  txDetails: TransactionDetails
  pendingTx?: PendingTx
}) {
  let createdAt = null
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    createdAt = detailedExecutionInfo.submittedAt
  }

  const safeTx = useSafeTx(txDetails)
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const threat = useThreatAnalysis(safeTx)
  const { recipient, contract } = counterpartyAnalysis

  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      {/* {!pendingTx && <TransactionChecks txId={txId} txDetails={txDetails} />} */}

      <SafeShieldWidget recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} txId={txId} />

      {pendingTx && <PendingTxInfo createdAt={createdAt} pendingTx={pendingTx} />}

      <ConfirmationsInfo detailedExecutionInfo={detailedExecutionInfo} txId={txId} />
    </YStack>
  )
}
