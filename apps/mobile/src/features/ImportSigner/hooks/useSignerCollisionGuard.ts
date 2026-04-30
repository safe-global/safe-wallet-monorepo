import { Alert } from 'react-native'
import { useCallback, useMemo } from 'react'
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
    case 'passkey':
      return 'as a passkey signer'
    default:
      // Exhaustiveness check: if a new signer kind is added to the union,
      // `existing satisfies never` fails to compile. The runtime return is
      // a safe fallback in case a mismatched shape slips past TS.
      existing satisfies never
      return 'as an existing signer'
  }
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

  // Normalize once per signers change so the guard is O(1) per import attempt,
  // regardless of how addresses were cased when they were stored.
  const signersByNormalizedAddress = useMemo(
    () => new Map(Object.values(signers).map((signer) => [signer.value.toLowerCase(), signer])),
    [signers],
  )

  const guardAgainstCollision = useCallback(
    (address: string, newType: SignerKind): boolean => {
      const existing = signersByNormalizedAddress.get(address.toLowerCase())
      if (!existing || existing.type === newType) {
        return false
      }
      showCollisionAlert(existing)
      return true
    },
    [signersByNormalizedAddress],
  )

  return { guardAgainstCollision }
}
