import { useAccount, useProvider } from '@reown/appkit-react-native'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Returns whether the given signer address has an active WalletConnect session.
 * Checks that the AppKit provider exists, the wallet is connected, and the
 * connected address matches the signer address.
 */
export function useWalletConnectStatus(signerAddress: string): boolean {
  const { provider } = useProvider()
  const { address, isConnected } = useAccount()

  return Boolean(provider && isConnected && address && sameAddress(address, signerAddress))
}
