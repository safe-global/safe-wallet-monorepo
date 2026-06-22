import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAppSelector } from '@/src/store/hooks'
import { selectDappMetadataByTxHash } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'

export type DappOrigin = {
  name: string
  logoUri?: string
}

// Carries the originating WalletConnect dApp (if any) from this provider down to the shared
// TransactionHeader, which is rendered by every confirmation-view. Avoids threading a prop
// through each view; a tx with no WC origin (e.g. history) → null → no dApp attribution.
const DappOriginContext = createContext<DappOrigin | null>(null)

// Exposed for unit tests that need to inject an origin directly without seeding the store.
export const DappOriginContextProvider = DappOriginContext.Provider

// Owns the "is this a dApp tx?" question: it resolves the originating dApp from the WC store by
// txId so consumers (the ConfirmTx container) stay decoupled from WalletConnect specifics.
export function DappOriginProvider({ txId, children }: { txId: string; children: ReactNode }) {
  const dappMetadata = useAppSelector((state) => selectDappMetadataByTxHash(state, txId))
  // Memoized so context consumers don't re-render on every unrelated parent render.
  const dappOrigin = useMemo(
    () => (dappMetadata ? { name: dappMetadata.name, logoUri: dappMetadata.icons?.[0] } : null),
    [dappMetadata],
  )
  return <DappOriginContext.Provider value={dappOrigin}>{children}</DappOriginContext.Provider>
}

export const useDappOrigin = (): DappOrigin | null => useContext(DappOriginContext)
