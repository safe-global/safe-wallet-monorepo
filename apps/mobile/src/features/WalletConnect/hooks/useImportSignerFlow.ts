import { useCallback } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppKit } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import { useSignerCollisionGuard } from '@/src/features/ImportSigner/hooks/useSignerCollisionGuard'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import {
  useConnect,
  UnsupportedChainError,
  UserRejectedError,
  showUnsupportedChainAlert,
  isProposalExpiredError,
} from './useConnect'
import { Alert } from 'react-native'

/**
 * Handles the signer import flow: ownership validation and navigation
 * after a new wallet connects via WalletConnect.
 */
export function useImportSignerFlow() {
  const { disconnect, close } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const { validateAddressOwnership } = useAddressOwnershipValidation()
  const { guardAgainstCollision } = useSignerCollisionGuard()
  const connect = useConnect()

  const initiateConnection = useCallback(async () => {
    try {
      const { address, walletName, walletIcon } = await connect()
      const checksumAddress = getAddress(address)
      const result = await validateAddressOwnership(checksumAddress)

      if (result.isOwner) {
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
        disconnect()

        router.push({
          pathname: '/import-signers/connect-signer-error',
          params: { address: checksumAddress, walletIcon },
        })
      }
    } catch (error) {
      if (error instanceof UnsupportedChainError) {
        showUnsupportedChainAlert()
        return
      }

      if (error instanceof UserRejectedError) {
        Logger.info('User rejected WC connect during signer import')
        close()
        return
      }

      if (isProposalExpiredError(error)) {
        Logger.warn('WalletConnect proposal expired during signer import:', error)
      } else {
        Logger.error('Error during signer import:', error)
      }

      // Tear down any half-formed pairing before dismissing the modal so we
      // don't leak relay subscriptions or ghost sessions on retry.
      try {
        disconnect()
      } catch (disconnectError) {
        Logger.warn('Failed to disconnect WC session after import error:', disconnectError)
      }
      close()
      Alert.alert('Error during signer import', 'Something went wrong while importing the signer. Please try again.', [
        { text: 'OK' },
      ])
    }
  }, [connect, validateAddressOwnership, switchNetworkIfNeeded, disconnect, guardAgainstCollision, close])

  return { initiateConnection }
}

export type ImportSignerFlowResult = ReturnType<typeof useImportSignerFlow>
