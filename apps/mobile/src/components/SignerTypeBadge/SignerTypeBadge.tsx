import React from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectSignerByAddress } from '@/src/store/signersSlice'
import { LedgerSignerBadge } from '@/src/features/Ledger/components/LedgerSignerBadge'
import { PasskeySignerBadge } from '@/src/features/PasskeySetup/components/PasskeySignerBadge'
import { WalletConnectBadge } from '@/src/features/WalletConnect/components/WalletConnectBadge'

interface SignerBadgeProps {
  address: `0x${string}`
  size?: number
  fontSize?: number
  testID?: string
  skipStatus?: boolean
}

export const SignerTypeBadge = ({
  address,
  size = 32,
  fontSize = 10,
  testID,
  skipStatus = false,
}: SignerBadgeProps) => {
  const signer = useAppSelector((state) => selectSignerByAddress(state, address))

  if (signer?.type === 'walletconnect') {
    return <WalletConnectBadge address={address} testID={testID} size={size} skipStatus={skipStatus} />
  }

  if (signer?.type === 'ledger') {
    return <LedgerSignerBadge size={size} fontSize={fontSize} testID={testID} />
  }

  if (signer?.type === 'passkey') {
    return <PasskeySignerBadge size={size} fontSize={fontSize} testID={testID} />
  }

  return null
}
