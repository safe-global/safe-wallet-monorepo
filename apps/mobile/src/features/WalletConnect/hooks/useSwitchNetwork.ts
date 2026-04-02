import { useCallback, useMemo } from 'react'
import { useAppKit, useAccount } from '@reown/appkit-react-native'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import Logger from '@/src/utils/logger'

/**
 * Provides network switching utilities for WalletConnect.
 *
 * - `switchNetworkIfNeeded` silently switches to the active Safe's chain if mismatched.
 * - `switchNetwork` explicitly switches to a given chainId.
 */
export function useSwitchNetwork() {
  const { switchNetwork: appKitSwitchNetwork } = useAppKit()
  const { chainId: walletChainId } = useAccount()
  const activeSafe = useDefinedActiveSafe()

  const isWrongNetwork = useMemo(() => {
    return String(walletChainId) !== activeSafe.chainId
  }, [walletChainId, activeSafe.chainId])

  const switchNetworkIfNeeded = useCallback(async () => {
    if (String(walletChainId) !== activeSafe.chainId) {
      await appKitSwitchNetwork(`eip155:${activeSafe.chainId}`).catch(() => {
        Logger.warn('Failed to switch wallet network, continuing with validation')
      })
    }
  }, [walletChainId, activeSafe.chainId, appKitSwitchNetwork])

  const switchNetwork = useCallback(
    (chainId: string) => appKitSwitchNetwork(`eip155:${chainId}`),
    [appKitSwitchNetwork],
  )

  return { switchNetworkIfNeeded, switchNetwork, isWrongNetwork }
}
