import { useCallback, useMemo } from 'react'
import { useAppKit, useAccount } from '@reown/appkit-react-native'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useAppSelector } from '@/src/store/hooks'
import Logger from '@/src/utils/logger'

/**
 * Provides network switching utilities for WalletConnect.
 *
 * - `switchNetworkIfNeeded` silently switches to the active Safe's chain if mismatched.
 * - `switchNetwork` explicitly switches to a given chainId.
 *
 * Returns `isWrongNetwork: false` and no-op callbacks when no active Safe is selected.
 */
export function useSwitchNetwork() {
  const { switchNetwork: appKitSwitchNetwork } = useAppKit()
  const { chainId: walletChainId } = useAccount()
  const activeSafe = useAppSelector(selectActiveSafe)

  const isWrongNetwork = useMemo(() => {
    if (!activeSafe) {
      return false
    }
    return String(walletChainId) !== activeSafe.chainId
  }, [walletChainId, activeSafe])

  const switchNetworkIfNeeded = useCallback(async () => {
    if (!activeSafe) {
      return
    }
    if (String(walletChainId) !== activeSafe.chainId) {
      await appKitSwitchNetwork(`eip155:${activeSafe.chainId}`).catch(() => {
        Logger.warn('Failed to switch wallet network, continuing with validation')
      })
    }
  }, [walletChainId, activeSafe, appKitSwitchNetwork])

  const switchNetwork = useCallback(
    (chainId: string) => appKitSwitchNetwork(`eip155:${chainId}`),
    [appKitSwitchNetwork],
  )

  return { switchNetworkIfNeeded, switchNetwork, isWrongNetwork }
}
