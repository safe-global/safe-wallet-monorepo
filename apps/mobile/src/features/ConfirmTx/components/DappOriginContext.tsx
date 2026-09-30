import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectDappMetadataByTxHash } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'

export type DappOrigin = {
  name: string
  logoUri?: string
}

// Carries the originating WC dApp (if any) to the shared TransactionHeader without threading a
// prop through every confirmation view; a tx with no WC origin → null → no dApp attribution.
const DappOriginContext = createContext<DappOrigin | null>(null)

// Exposed so tests can inject an origin without seeding the store.
export const DappOriginContextProvider = DappOriginContext.Provider

// Resolves the originating dApp from the WC store by txId, keeping consumers WC-agnostic.
export function DappOriginProvider({ txId, children }: { txId: string; children: ReactNode }) {
  const dappMetadata = useAppSelector((state) => selectDappMetadataByTxHash(state, txId))
  const dappOrigin = useMemo(
    () => (dappMetadata ? { name: dappMetadata.name, logoUri: dappMetadata.icons?.[0] } : null),
    [dappMetadata],
  )
  return <DappOriginContext.Provider value={dappOrigin}>{children}</DappOriginContext.Provider>
}

export const useDappOrigin = (): DappOrigin | null => useContext(DappOriginContext)
