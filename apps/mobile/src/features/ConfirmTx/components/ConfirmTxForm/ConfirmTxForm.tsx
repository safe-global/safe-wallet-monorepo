import { Address, SignerInfo } from '@/src/types/address'
import { SignForm } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { shortenAddress } from '@/src/utils/formatters'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  activeSigner?: SignerInfo | undefined
  isExpired: boolean
  txId: string
  hasSigned: boolean
}

export function ConfirmTxForm({
  hasEnoughConfirmations,
  activeSigner,
  isExpired,
  txId,
  hasSigned,
}: ConfirmTxFormProps) {
  const activeSafe = useDefinedActiveSafe()

  if (hasSigned) {
    return <AlreadySigned txId={txId} safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (hasEnoughConfirmations) {
    return <ExecuteForm safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (activeSigner && !isExpired) {
    return (
      <SignForm
        txId={txId}
        name={activeSigner?.name || shortenAddress(activeSigner?.value)}
        address={activeSigner?.value as Address}
      />
    )
  }

  return null
}
