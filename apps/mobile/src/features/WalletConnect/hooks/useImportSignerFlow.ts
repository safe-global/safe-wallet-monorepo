import { useCallback } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAppKit } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useConnect } from './useConnect'

/**
 * Handles the signer import flow: ownership validation and navigation
 * after a new wallet connects via WalletConnect.
 */
export function useImportSignerFlow() {
  const { disconnect } = useAppKit()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const { validateAddressOwnership } = useAddressOwnershipValidation()
  const connect = useConnect()

  const initiateConnection = useCallback(async () => {
    try {
      const { address, walletName, walletIcon } = await connect()
      const checksumAddress = getAddress(address)
      const result = await validateAddressOwnership(checksumAddress)

      if (result.isOwner) {
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
      if (error instanceof Error && error.message !== 'User rejected') {
        Logger.error('Error during signer import:', error)
      }
    }
  }, [connect, validateAddressOwnership, switchNetworkIfNeeded, disconnect])

  return { initiateConnection }
}
