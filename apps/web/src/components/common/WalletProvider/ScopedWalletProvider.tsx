import { type ReactElement, type ReactNode, useContext, useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { WalletContext, type WalletContextType } from './WalletContext'
import { useSignerWallet } from './useSignerWallet'

// The app-wide WalletProvider sits above every SafeScope, so it can't resolve a parent Safe on the scoped chain
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
