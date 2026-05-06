import { useCallback } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppKit } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import { useSignerCollisionGuard } from '@/src/features/ImportSigner/hooks/useSignerCollisionGuard'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect, handleWalletConnectError } from './useConnect'

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
      handleWalletConnectError(error, {
        flow: 'signer import',
        alertTitle: 'Error during signer import',
        alertBody: 'Something went wrong while importing the signer. Please try again.',
        close,
        disconnect,
      })
    }
  }, [connect, validateAddressOwnership, switchNetworkIfNeeded, disconnect, guardAgainstCollision, close])

  return { initiateConnection }
}

export type ImportSignerFlowResult = ReturnType<typeof useImportSignerFlow>
