import { useCallback } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { useAppKit } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect } from './useConnect'

/**
 * Handles the first WalletConnect reconnection attempt for existing signers.
 * On address mismatch, navigates to ReconnectError which owns subsequent retries.
 */
export function useReconnectFlow() {
  const { disconnect, close } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const connect = useConnect({ flow: 'reconnect' })

  const reconnect = useCallback(
    async (signerAddress: string) => {
      try {
        const result = await connect()
        // useConnect handled cancel / unsupported-chain internally.
        if (!result) {
          return
        }
        const reconnectAddress = getAddress(signerAddress)

        if (!sameAddress(reconnectAddress, result.address)) {
          // disconnect() is typed () => void but returns a Promise at runtime;
          // wrap in an awaited IIFE so async rejections don't escape unhandled.
          void (async () => {
            try {
              await disconnect()
            } catch (disconnectError) {
              Logger.warn('Failed to disconnect WC session after address mismatch:', disconnectError)
            }
          })()

          router.push({
            pathname: '/import-signers/reconnect-error',
            params: { address: reconnectAddress },
          })

          return
        }

        switchNetworkIfNeeded()
      } catch (error) {
        Logger.error('Error during reconnect:', error)
        // Tear down any half-formed pairing before dismissing the modal so we
        // don't leak relay subscriptions or ghost sessions on retry. AppKit's
        // useAppKit narrows disconnect to () => void, but the underlying call
        // returns a Promise — await inside an IIFE so async rejections are
        // captured rather than escaping as unhandled rejections.
        void (async () => {
          try {
            await disconnect()
          } catch (disconnectError) {
            Logger.warn('Failed to disconnect WC session after reconnect error:', disconnectError)
          }
        })()
        close()
        Alert.alert('Error during reconnect', 'Something went wrong while reconnecting the signer. Please try again.', [
          { text: 'OK' },
        ])
      }
    },
    [connect, disconnect, switchNetworkIfNeeded, close],
  )

  return { reconnect }
}

export type ReconnectFlowResult = ReturnType<typeof useReconnectFlow>
