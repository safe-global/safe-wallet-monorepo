import { Address, SignerInfo } from '@/src/types/address'
import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  activeSigner?: SignerInfo | undefined
  isExpired: boolean
  txId: string
  hasSigned: boolean
  canSign: boolean
}

export function ConfirmTxForm({
  hasEnoughConfirmations,
  activeSigner,
  isExpired,
  txId,
  hasSigned,
  canSign,
}: ConfirmTxFormProps) {
  const activeSafe = useDefinedActiveSafe()

  if (hasSigned) {
    return <AlreadySigned txId={txId} safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (!canSign) {
    return <CanNotSign address={activeSigner?.value as Address} txId={txId} />
  }

  if (hasEnoughConfirmations) {
    return <ExecuteForm safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (activeSigner && !isExpired) {
    return <SignForm txId={txId} address={activeSigner?.value as Address} />
  }

  return null
}
