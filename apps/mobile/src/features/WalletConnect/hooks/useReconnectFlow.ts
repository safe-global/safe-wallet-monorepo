import { useCallback } from 'react'
import { router } from 'expo-router'
import { useAppKit } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect, handleWalletConnectError } from './useConnect'

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
      // Loop so a ProposalExpiredError (benign QR expiry) transparently
      // reopens the connect modal with a fresh proposal. Any other error
      // exits the loop via handleWalletConnectError returning 'handled'.
      // eslint-disable-next-line no-constant-condition
      while (true) {
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
          return
        } catch (error) {
          const outcome = await handleWalletConnectError(error, {
            flow: 'reconnect',
            alertTitle: 'Error during reconnect',
            alertBody: 'Something went wrong while reconnecting the signer. Please try again.',
            close,
            disconnect,
          })
          if (outcome === 'retry') {
            continue
          }
          return
        }
      }
    },
    [connect, disconnect, switchNetworkIfNeeded, close],
  )

  return { reconnect }
}

export type ReconnectFlowResult = ReturnType<typeof useReconnectFlow>
