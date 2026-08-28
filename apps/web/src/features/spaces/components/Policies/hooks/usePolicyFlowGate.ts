import { useCallback } from 'react'
import useConnectWallet from '@/components/common/ConnectWallet/useConnectWallet'
import useWallet from '@/hooks/wallets/useWallet'

export type PolicyFlow = () => void

/**
 * Runs a policy flow only if a wallet is connected. If none is, the wallet-connect dialog opens
 * first and the flow runs after the user connects.
 *
 * The wallet is checked on every call rather than once per session. A user can disconnect at any
 * time, and without the repeated check they would reach a step that asks for a signature that no
 * connected wallet can give.
 *
 * Returns true if the flow ran, false if the user closed the dialog without connecting.
 */
const usePolicyFlowGate = () => {
  const wallet = useWallet()
  const connectWallet = useConnectWallet()

  return useCallback(
    async (openFlow: PolicyFlow): Promise<boolean> => {
      if (wallet) {
        openFlow()
        return true
      }

      const wallets = await connectWallet()

      // Onboard resolves with an empty list when the user closes the dialog without connecting.
      if (!wallets?.length) return false

      openFlow()
      return true
    },
    [wallet, connectWallet],
  )
}

export default usePolicyFlowGate
