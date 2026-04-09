import { useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { useAppKit } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useOnAppKitConnect } from './useOnAppKitConnect'

/**
 * Handles the first WalletConnect reconnection attempt for existing signers.
 * On address mismatch, navigates to ReconnectError which owns subsequent retries.
 *
 * Uses CONNECT_SUCCESS event subscription instead of useEffect to respond
 * directly to connection events. The pendingAddressRef guard ensures only
 * user-initiated reconnections (via reconnect()) trigger the flow —
 * auto-reconnects and connections from useImportSignerFlow are ignored.
 */
export function useReconnectFlow() {
  const { open, disconnect } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const pendingAddressRef = useRef<string | null>(null)

  useOnAppKitConnect(
    (eventData) => {
      if (!pendingAddressRef.current) {
        return
      }

      const reconnectAddress = getAddress(pendingAddressRef.current)
      pendingAddressRef.current = null

      const connectedAddress = eventData.address

      if (!connectedAddress || !sameAddress(reconnectAddress, connectedAddress)) {
        disconnect()

        router.push({
          pathname: '/import-signers/reconnect-error',
          params: { address: reconnectAddress },
        })

        return
      }

      switchNetworkIfNeeded()
    },
    () => {
      pendingAddressRef.current = null
    },
  )

  const reconnect = useCallback(
    async (signerAddress: string) => {
      await disconnect()
      pendingAddressRef.current = signerAddress
      open({ view: 'Connect' })
    },
    [disconnect, open],
  )

  return { reconnect }
}
