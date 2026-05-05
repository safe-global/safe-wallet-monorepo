import { useCallback } from 'react'
import { router } from 'expo-router'
import { useAppKit } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSwitchNetwork } from './useSwitchNetwork'
import {
  useConnect,
  UnsupportedChainError,
  showUnsupportedChainAlert,
  UserRejectedError,
  isProposalExpiredError,
} from './useConnect'
import { Alert } from 'react-native'
import Logger from '@/src/utils/logger'

/**
 * Handles the first WalletConnect reconnection attempt for existing signers.
 * On address mismatch, navigates to ReconnectError which owns subsequent retries.
 */
export function useReconnectFlow() {
  const { disconnect, close } = useAppKit()
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

        if (error instanceof UserRejectedError) {
          Logger.info('User rejected WC connect during reconnect')
          close()
          return
        }

        if (isProposalExpiredError(error)) {
          Logger.warn('WalletConnect proposal expired during reconnect:', error)
        } else {
          Logger.error('Error during reconnect:', error)
        }

        // Tear down any half-formed pairing before dismissing the modal so we
        // don't leak relay subscriptions or ghost sessions on retry.
        try {
          disconnect()
        } catch (disconnectError) {
          Logger.warn('Failed to disconnect WC session after reconnect error:', disconnectError)
        }
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
