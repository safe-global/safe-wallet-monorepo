import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useOptionalWalletConnectContext } from '../context/WalletConnectContext'

/**
 * Returns whether the given signer address has an active WalletConnect session.
 *
 * Uses the WalletConnect context rather than AppKit hooks directly so it
 * works safely before AppKit is initialized (returns `false`).
 */
export function useWalletConnectStatus(signerAddress: string): boolean {
  const context = useOptionalWalletConnectContext()

  if (!context) {
    return false
  }

  return Boolean(context.address && sameAddress(context.address, signerAddress))
}
