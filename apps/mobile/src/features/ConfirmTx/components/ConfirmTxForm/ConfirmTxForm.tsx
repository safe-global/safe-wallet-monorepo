import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'

interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  isExpired: boolean
  txId: string
}

export function ConfirmTxForm({ hasEnoughConfirmations, isExpired, txId }: ConfirmTxFormProps) {
  const activeSafe = useDefinedActiveSafe()
  const { signerState } = useTransactionSigner(txId)
  const { activeSigner, hasSigned, canSign } = signerState

  if (hasSigned) {
    return (
      <AlreadySigned
        hasEnoughConfirmations={hasEnoughConfirmations}
        txId={txId}
        safeAddress={activeSafe.address}
        chainId={activeSafe.chainId}
      />
    )
  }

  if (!canSign) {
    return <CanNotSign />
  }

  if (hasEnoughConfirmations) {
    return <ExecuteForm safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (activeSigner && !isExpired) {
    return <SignForm txId={txId} />
  }

  return null
}
