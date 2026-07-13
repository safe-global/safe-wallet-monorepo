import { useCallback } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppKit } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import { useSignerCollisionGuard } from '@/src/features/ImportSigner/hooks/useSignerCollisionGuard'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect } from './useConnect'

/**
 * Handles the signer import flow: ownership validation and navigation
 * after a new wallet connects via WalletConnect.
 */
export function useImportSignerFlow() {
  const { disconnect, close } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const { validateAddressOwnership } = useAddressOwnershipValidation()
  const { guardAgainstCollision } = useSignerCollisionGuard()
  const connect = useConnect({ flow: 'signer import' })

  const initiateConnection = useCallback(async () => {
    try {
      const result = await connect()
      // useConnect handled cancel / unsupported-chain internally.
      if (!result) {
        return
      }
      const { address, walletName, walletIcon } = result
      const checksumAddress = getAddress(address)
      const ownership = await validateAddressOwnership(checksumAddress)

      if (ownership.isOwner) {
        if (guardAgainstCollision(checksumAddress, 'walletconnect')) {
          try {
            await disconnect()
          } catch (disconnectError) {
            Logger.error('Failed to disconnect WC session after collision:', disconnectError)
          }
          return
        }

        await switchNetworkIfNeeded()

        router.push({
          pathname: '/import-signers/name-signer',
          params: { address: checksumAddress, walletName },
        })
      } else {
        // disconnect() is typed () => void but returns a Promise at runtime;
        // wrap in an awaited IIFE so async rejections don't escape unhandled.
        void (async () => {
          try {
            await disconnect()
          } catch (disconnectError) {
            Logger.warn('Failed to disconnect WC session after non-owner connect:', disconnectError)
          }
        })()

        router.push({
          pathname: '/import-signers/connect-signer-error',
          params: { address: checksumAddress, walletIcon },
        })
      }
    } catch (error) {
      Logger.error('Error during signer import:', error)
      // Tear down any half-formed pairing before dismissing the modal so we
      // don't leak relay subscriptions or ghost sessions on retry. AppKit's
      // useAppKit narrows disconnect to () => void, but the underlying call
      // returns a Promise — await inside an IIFE so async rejections are
      // captured rather than escaping as unhandled rejections.
      void (async () => {
        try {
          await disconnect()
        } catch (disconnectError) {
          Logger.warn('Failed to disconnect WC session after signer import error:', disconnectError)
        }
      })()
      close()
      Alert.alert('Error during signer import', 'Something went wrong while importing the signer. Please try again.', [
        { text: 'OK' },
      ])
    }
  }, [connect, validateAddressOwnership, switchNetworkIfNeeded, disconnect, guardAgainstCollision, close])

  return { initiateConnection }
}

export type ImportSignerFlowResult = ReturnType<typeof useImportSignerFlow>
