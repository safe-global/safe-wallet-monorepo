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
}

export const useSignerCollisionGuard = () => {
  const signers = useAppSelector(selectSigners)

  const checkCollision = useCallback(
    (address: string, newType: SignerKind): Signer | null => {
      const existing = Object.values(signers).find((signer) => sameAddress(signer.value, address))
      if (!existing || existing.type === newType) {
        return null
      }
      return existing
    },
    [signers],
  )

  const showCollisionAlert = useCallback((existing: Signer) => {
    Alert.alert(
      'Signer already imported',
      `This address is already imported ${describeExistingSigner(existing)}. Remove it under Settings → Signers first, or use the existing signer to sign transactions.`,
      [{ text: 'OK' }],
    )
  }, [])

  return { checkCollision, showCollisionAlert }
}
