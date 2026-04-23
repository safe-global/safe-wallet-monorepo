import { useCallback } from 'react'
import { router } from 'expo-router'
import { useAppKit } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect, UnsupportedChainError, showUnsupportedChainAlert } from './useConnect'

/**
 * Handles the first WalletConnect reconnection attempt for existing signers.
 * On address mismatch, navigates to ReconnectError which owns subsequent retries.
 */
export function useReconnectFlow() {
  const { disconnect } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const connect = useConnect()

  const reconnect = useCallback(
    async (signerAddress: string) => {
      try {
        const { address } = await connect()
        const reconnectAddress = getAddress(signerAddress)

        if (!sameAddress(reconnectAddress, address)) {
          disconnect()

          router.push({
            pathname: '/import-signers/reconnect-error',
            params: { address: reconnectAddress },
          })

          return
        }

        switchNetworkIfNeeded()
      } catch (error) {
        if (error instanceof UnsupportedChainError) {
          showUnsupportedChainAlert()
          return
        }
        // CONNECT_ERROR or USER_REJECTED — no action needed
      }
    },
    [connect, disconnect, switchNetworkIfNeeded],
  )

  return { reconnect }
}
