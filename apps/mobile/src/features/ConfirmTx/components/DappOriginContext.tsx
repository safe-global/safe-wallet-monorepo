import { createContext, useContext } from 'react'

export type DappOrigin = {
  name: string
  logoUri?: string
}

// Carries the originating WalletConnect dApp (if any) from ConfirmTxContainer down to the
// shared TransactionHeader, which is rendered by every confirmation-view. Avoids threading
// a prop through each view; absent provider (e.g. history) → no dApp attribution.
const DappOriginContext = createContext<DappOrigin | null>(null)

export const DappOriginProvider = DappOriginContext.Provider

export const useDappOrigin = (): DappOrigin | null => useContext(DappOriginContext)
