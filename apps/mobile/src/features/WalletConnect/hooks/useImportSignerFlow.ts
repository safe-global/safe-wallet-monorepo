import { useCallback, useRef } from 'react'
import { router } from 'expo-router'
import { getAddress } from 'ethers'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import Logger from '@/src/utils/logger'
import { useSwitchNetwork } from './useSwitchNetwork'
import { useOnAppKitConnect } from './useOnAppKitConnect'

/**
 * Handles the signer import flow: ownership validation and navigation
 * after a new wallet connects via WalletConnect.
 *
 * Uses CONNECT_SUCCESS event subscription instead of useEffect to respond
 * directly to connection events. The connectInitiatedRef guard ensures
 * only user-initiated connections (via initiateConnection()) trigger the
 * flow — auto-reconnects and connections from useReconnectFlow are ignored.
 */
export function useImportSignerFlow() {
  const { open, disconnect } = useAppKit()
  const { address: accountAddress, isConnected: walletIsConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const { switchNetworkIfNeeded } = useSwitchNetwork()
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  const connectInitiatedRef = useRef(false)

  const isConnected = Boolean(walletIsConnected && accountAddress && walletInfo)

  const pushConnectSignerError = useCallback(
    (address: string) => {
      disconnect()

      router.push({
        pathname: '/import-signers/connect-signer-error',
        params: { address, walletIcon: walletInfo?.icon ?? '' },
      })
    },
    [disconnect, walletInfo?.icon],
  )

  useOnAppKitConnect(
    (eventData) => {
      if (!connectInitiatedRef.current) {
        return
      }

      connectInitiatedRef.current = false

      const rawAddress = eventData.address

      if (!rawAddress) {
        Logger.warn('CONNECT_SUCCESS fired without address')
        return
      }

      const checksumAddress = getAddress(rawAddress)
      const walletName = eventData.properties.name ?? ''

      const validateAndNavigate = async () => {
        try {
          const result = await validateAddressOwnership(checksumAddress)

          if (result.isOwner) {
            await switchNetworkIfNeeded()

            router.push({
              pathname: '/import-signers/name-signer',
              params: {
                address: checksumAddress,
                walletName,
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

      validateAndNavigate().catch((error) => {
        Logger.error('Unexpected error in validateAndNavigate:', error)
      })
    },
    () => {
      connectInitiatedRef.current = false
    },
  )

  const initiateConnection = useCallback(async () => {
    await disconnect()
    connectInitiatedRef.current = true
    open({ view: 'Connect' })
  }, [disconnect, open])

  return { initiateConnection, isConnected }
}
