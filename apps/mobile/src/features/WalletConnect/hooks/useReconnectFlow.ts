import { useCallback, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSwitchNetwork } from './useSwitchNetwork'

/**
 * Handles the first WalletConnect reconnection attempt for existing signers.
 * On address mismatch, navigates to ReconnectError which owns subsequent retries.
 */
export function useReconnectFlow() {
  const { open, disconnect } = useAppKit()
  const { address, isConnected: walletIsConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const pendingAddressRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pendingAddressRef.current || !walletIsConnected || !address || !walletInfo) {
      return
    }

    const reconnectAddress = getAddress(pendingAddressRef.current)
    pendingAddressRef.current = null

    if (!sameAddress(reconnectAddress, address)) {
      disconnect()

      router.push({
        pathname: '/import-signers/reconnect-error',
        params: { address: reconnectAddress },
      })

      return
    }

    switchNetworkIfNeeded()
  }, [walletIsConnected, address, walletInfo, disconnect, switchNetworkIfNeeded])

  const reconnect = useCallback(
    (signerAddress: string) => {
      pendingAddressRef.current = signerAddress
      open({ view: 'Connect' })
    },
    [open],
  )

  return { reconnect }
}
