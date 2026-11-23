import { type ReactElement, type ReactNode, useContext, useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { WalletContext, type WalletContextType } from './WalletContext'
import { useSignerWallet } from './useSignerWallet'

/**
 * Re-resolves the signer on the scoped Safe's chain. The app-wide WalletProvider sits above every
 * SafeScope, so it resolves a picked parent Safe on the URL/wallet chain, which is wrong in a Space-level flow.
 * The signer selection and parent Safe nonce stay in the app-wide provider.
 */
const ScopedWalletProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const parent = useContext(WalletContext)
  const scope = useSafeScope()

  const chosenNonce = useMemo(
    () => ({ get: parent?.getParentSafeNonce ?? (() => undefined), clear: parent?.clearParentSafeNonce ?? (() => {}) }),
    [parent?.getParentSafeNonce, parent?.clearParentSafeNonce],
  )
  const signer = useSignerWallet({
    wallet: scope ? (parent?.connectedWallet ?? null) : null,
    signerAddress: parent?.signerAddress,
    chainId: scope?.chainId,
    web3ReadOnly: scope?.web3ReadOnly,
    chosenNonce,
  })

  const isScoped = !!scope
  const value = useMemo<WalletContextType | null>(
    () => (parent && isScoped ? { ...parent, signer } : parent),
    [parent, isScoped, signer],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export default ScopedWalletProvider
