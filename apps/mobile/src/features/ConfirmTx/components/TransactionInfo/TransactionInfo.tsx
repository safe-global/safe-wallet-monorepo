import React, { useEffect } from 'react'
import { YStack } from 'tamagui'
import { MultisigExecutionDetails, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ConfirmationsInfo } from '../ConfirmationsInfo'
import { isMultisigDetailedExecutionInfo } from '@/src/utils/transaction-guards'
import { PendingTx } from '@/src/store/pendingTxsSlice'
import { PendingTxInfo } from '@/src/features/ConfirmTx/components/PendingTxInfo'
import { SafeShieldWidget } from '@/src/features/SafeShield/components/SafeShieldWidget'
import { BalanceChangeBlock } from '@/src/features/SafeShield/components/BalanceChange'
import useSafeTx from '@/src/hooks/useSafeTx'
import { useCounterpartyAnalysis, useThreatAnalysis } from '@/src/features/SafeShield/hooks'
import { useSafeShieldSeverity } from '@/src/features/SafeShield/hooks/useSafeShieldSeverity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'

export function TransactionInfo({
  detailedExecutionInfo,
  txId,
  txDetails,
  pendingTx,
  onSeverityChange,
}: {
  detailedExecutionInfo: MultisigExecutionDetails
  txId: string
  txDetails?: TransactionDetails
  pendingTx?: PendingTx
  onSeverityChange?: (severity: Severity | undefined) => void
}) {
  let createdAt = null
  if (isMultisigDetailedExecutionInfo(detailedExecutionInfo)) {
    createdAt = detailedExecutionInfo.submittedAt
  }

  const safeTx = useSafeTx(txDetails)
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState
  const counterpartyAnalysis = useCounterpartyAnalysis(safeTx)
  const threat = useThreatAnalysis(safeTx)
  const { recipient, contract } = counterpartyAnalysis
  const highlightedSeverity = useSafeShieldSeverity({ recipient, contract, threat })

  useEffect(() => {
    onSeverityChange?.(highlightedSeverity)
  }, [highlightedSeverity, onSeverityChange])

  return (
    <YStack paddingHorizontal="$4" gap="$4" marginTop="$4">
      {activeSigner && (
        <>
          <SafeShieldWidget recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} txId={txId} />
          <BalanceChangeBlock threat={threat} />
        </>
      )}

      {pendingTx && <PendingTxInfo createdAt={createdAt} pendingTx={pendingTx} />}

      <ConfirmationsInfo detailedExecutionInfo={detailedExecutionInfo} txId={txId} />
    </YStack>
  )
}
