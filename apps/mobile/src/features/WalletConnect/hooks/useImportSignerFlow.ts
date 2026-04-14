import { useCallback, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useStableAppKitEvent } from './useStableAppKitEvent'

/**
 * Handles the signer import flow: ownership validation and navigation
 * after a new wallet connects via WalletConnect.
 */
export function useImportSignerFlow() {
  const { open, disconnect } = useAppKit()
  const { address, isConnected: walletIsConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  const registeredRef = useRef<string | null>(null)
  const connectInitiatedRef = useRef(false)

  const isConnected = Boolean(walletIsConnected && address && walletInfo)

  const pushConnectSignerError = useCallback(
    (address: string) => {
      if (!address) {
        return
      }

      disconnect()

      router.push({
        pathname: '/import-signers/connect-signer-error',
        params: { address: getAddress(address), walletIcon: walletInfo?.icon ?? '' },
      })
    },
    [disconnect, walletInfo?.icon],
  )

  // Validate ownership then navigate when the user initiates a new connection
  useEffect(() => {
    if (!connectInitiatedRef.current || !isConnected || !address) {
      return
    }

    connectInitiatedRef.current = false

    const checksumAddress = getAddress(address)

    const validateAndNavigate = async () => {
      try {
        const result = await validateAddressOwnership(checksumAddress)

        if (result.isOwner) {
          await switchNetworkIfNeeded()
          registeredRef.current = address

          router.push({
            pathname: '/import-signers/name-signer',
            params: {
              address: checksumAddress,
              walletName: walletInfo?.name ?? '',
            },
          })
        } else {
          pushConnectSignerError(checksumAddress)
        }
      } catch (error) {
        Logger.error('Error validating signer ownership:', error)
        pushConnectSignerError(checksumAddress)
      }
    }

    validateAndNavigate()
  }, [isConnected, address, walletInfo?.name, validateAddressOwnership, switchNetworkIfNeeded, pushConnectSignerError])

  // Reset guard when wallet disconnects so reconnection triggers navigation
  useEffect(() => {
    if (!walletIsConnected) {
      registeredRef.current = null
    }
  }, [walletIsConnected])

  const initiateConnection = useCallback(() => {
    connectInitiatedRef.current = true
    open({ view: 'Connect' })
  }, [open])

  useStableAppKitEvent('CONNECT_ERROR', () => {
    connectInitiatedRef.current = false
  })

  useStableAppKitEvent('USER_REJECTED', () => {
    connectInitiatedRef.current = false
  })

  return { initiateConnection, isConnected }
}
