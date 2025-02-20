import { Address, SignerInfo } from '@/src/types/address'
import { SignFormContainer } from '../SignForm'
import React from 'react'
import { ExecuteForm } from '../ExecuteForm'
import { shortenAddress } from '@/src/utils/formatters'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

interface ConfirmTxFormProps {
  hasEnoughConfirmations: boolean
  activeSigner?: SignerInfo | undefined
  isExpired: boolean
  txId: string
}

export function ConfirmTxForm({ hasEnoughConfirmations, activeSigner, isExpired, txId }: ConfirmTxFormProps) {
  const activeSafe = useDefinedActiveSafe()

  if (hasEnoughConfirmations) {
    return <ExecuteForm safeAddress={activeSafe.address} chainId={activeSafe.chainId} />
  }

  if (activeSigner && !isExpired) {
    return (
      <SignFormContainer
        txId={txId}
        name={activeSigner?.name || shortenAddress(activeSigner?.value)}
        address={activeSigner?.value as Address}
      />
    )
  }

  return null
}
