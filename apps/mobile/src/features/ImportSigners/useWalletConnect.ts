import { useCallback, useEffect, useRef } from 'react'
import { router } from 'expo-router'
import { useAccount, useAppKit, useWalletInfo } from '@reown/appkit-react-native'
import { getAddress } from 'ethers'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAddressOwnershipValidation } from '@/src/hooks/useAddressOwnershipValidation'
import Logger from '@/src/utils/logger'

/**
 * Manages the WalletConnect connection flow for signer import.
 * Handles ownership validation and navigation after a wallet connects.
 * Returns `initiateConnection` to open the WalletConnect modal.
 */
export function useWalletConnect() {
  const { open, disconnect } = useAppKit()
  const { address, isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()
  const registeredRef = useRef<string | null>(null)
  const connectInitiatedRef = useRef(false)
  const { validateAddressOwnership } = useAddressOwnershipValidation()

  // Validate ownership then navigate when the user initiates a new connection
  useEffect(() => {
    if (
      !connectInitiatedRef.current ||
      !isConnected ||
      !address ||
      !walletInfo ||
      sameAddress(registeredRef.current ?? undefined, address)
    ) {
      return
    }

    registeredRef.current = address
    connectInitiatedRef.current = false

    const checksumAddress = getAddress(address)
    let cancelled = false

    const validateAndNavigate = async () => {
      try {
        const result = await validateAddressOwnership(checksumAddress)

        if (cancelled) {
          return
        }

        if (result.isOwner) {
          router.push({
            pathname: '/import-signers/name-signer',
            params: {
              address: checksumAddress,
              walletName: walletInfo.name ?? '',
            },
          })
        } else {
          disconnect()
          router.push({
            pathname: '/import-signers/connect-signer-error',
            params: { address: checksumAddress },
          })
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        Logger.error('Error validating signer ownership:', error)
        disconnect()
        router.push({
          pathname: '/import-signers/connect-signer-error',
          params: { address: checksumAddress },
        })
      }
    }

    validateAndNavigate()

    return () => {
      cancelled = true
    }
  }, [isConnected, address, walletInfo, validateAddressOwnership])

  // Reset guard when wallet disconnects so reconnection triggers navigation
  useEffect(() => {
    if (!isConnected) {
      registeredRef.current = null
    }
  }, [isConnected])

  const initiateConnection = useCallback(() => {
    connectInitiatedRef.current = true
    open({ view: 'Connect' })
  }, [open])

  return { initiateConnection }
}
