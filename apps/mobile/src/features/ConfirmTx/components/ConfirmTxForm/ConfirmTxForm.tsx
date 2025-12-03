import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'
import { CanNotExecute } from '@/src/features/ExecuteTx/components/CanNotExecute'
import { PendingTx } from '@/src/features/ConfirmTx/components/PendingTx'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  isExpired: boolean
  isPending: boolean
  txId: string
  highlightedSeverity?: Severity
  riskAcknowledged: boolean
  onRiskAcknowledgedChange: (acknowledged: boolean) => void
}

export function ConfirmTxForm({
  hasEnoughConfirmations,
  isExpired,
  isPending,
  txId,
  highlightedSeverity,
  riskAcknowledged,
  onRiskAcknowledgedChange,
}: ConfirmTxFormProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner, hasSigned, canSign } = signerState
  const showRiskCheckbox = highlightedSeverity === Severity.CRITICAL

  if (isPending) {
    return <PendingTx />
  }

  if (!activeSigner) {
    return <CanNotExecute />
  }

  if (hasEnoughConfirmations) {
    return (
      <ExecuteForm
        txId={txId}
        riskAcknowledged={riskAcknowledged}
        onRiskAcknowledgedChange={onRiskAcknowledgedChange}
        showRiskCheckbox={showRiskCheckbox}
      />
    )
  }

  if (hasSigned) {
    return <AlreadySigned />
  }

  if (!canSign) {
    return <CanNotSign />
  }

  if (activeSigner && !isExpired) {
    return (
      <SignForm
        txId={txId}
        showRiskCheckbox={showRiskCheckbox}
        riskAcknowledged={riskAcknowledged}
        onRiskAcknowledgedChange={onRiskAcknowledgedChange}
      />
    )
  }

  return null
}
