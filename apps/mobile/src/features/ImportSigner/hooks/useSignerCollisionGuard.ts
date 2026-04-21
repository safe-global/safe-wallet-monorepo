import { Alert } from 'react-native'
import { useCallback } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners, type Signer } from '@/src/store/signersSlice'

type SignerKind = Signer['type']

const describeExistingSigner = (existing: Signer): string => {
  switch (existing.type) {
    case 'private-key':
      return 'as a private key signer'
    case 'ledger':
      return 'as a Ledger signer'
    case 'walletconnect':
      return existing.walletName ? `via ${existing.walletName}` : 'as a WalletConnect signer'
  }
  // Defensive fallback in case a future signer type slips past the compile-time check
  return 'as an existing signer'
}

const showCollisionAlert = (existing: Signer) => {
  Alert.alert(
    'Signer already imported',
    `This address is already imported ${describeExistingSigner(existing)}. Remove it under Settings → Signers first, or use the existing signer to sign transactions.`,
    [{ text: 'OK' }],
  )
}

export const useSignerCollisionGuard = () => {
  const signers = useAppSelector(selectSigners)

  const guardAgainstCollision = useCallback(
    (address: string, newType: SignerKind): boolean => {
      const existing = Object.values(signers).find((signer) => sameAddress(signer.value, address))
      if (!existing || existing.type === newType) {
        return false
      }
      showCollisionAlert(existing)
      return true
    },
    [signers],
  )

  return { guardAgainstCollision }
}
