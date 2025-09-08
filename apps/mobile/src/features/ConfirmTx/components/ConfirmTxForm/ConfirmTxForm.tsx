import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'
import { CanNotExecute } from '@/src/features/ExecuteTx/components/CanNotExecute'

interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  isExpired: boolean
  txId: string
}

export function ConfirmTxForm({ hasEnoughConfirmations, isExpired, txId }: ConfirmTxFormProps) {
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner, hasSigned, canSign } = signerState

  if (!activeSigner) {
    return <CanNotExecute />
  }

  if (hasEnoughConfirmations) {
    return <ExecuteForm txId={txId} />
  }

  if (hasSigned) {
    return <AlreadySigned />
  }

  if (!canSign) {
    return <CanNotSign />
  }

  if (activeSigner && !isExpired) {
    return <SignForm txId={txId} />
  }

  return null
}
