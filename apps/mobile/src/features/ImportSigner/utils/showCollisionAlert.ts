import { Alert } from 'react-native'
import type { Signer } from '@/src/store/signersSlice'

const describeExistingSigner = (existing: Signer): string => {
  switch (existing.type) {
    case 'private-key':
      return 'as a private key signer'
    case 'ledger':
      return 'as a Ledger signer'
    case 'walletconnect':
      return existing.walletName ? `via ${existing.walletName}` : 'as a WalletConnect signer'
    default:
      // Exhaustiveness check: if a new signer kind is added to the union,
      // `existing satisfies never` fails to compile. The runtime return is
      // a safe fallback in case a mismatched shape slips past TS.
      existing satisfies never
      return 'as an existing signer'
  }
}

export const showCollisionAlert = (existing: Signer): void => {
  Alert.alert(
    'Signer already imported',
    `This address is already imported ${describeExistingSigner(existing)}. Remove it under Settings → Signers first, or use the existing signer to sign transactions.`,
    [{ text: 'OK' }],
  )
}
