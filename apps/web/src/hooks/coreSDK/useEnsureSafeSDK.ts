import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import { initializeSafeSDK, resetSafeSDK, useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { trackError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { useAppDispatch, useAppSelector } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { selectUndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import type Safe from '@safe-global/protocol-kit'

/**
 * Hook that ensures the Safe SDK is initialized with current dependencies
 * Returns [sdk, isLoading, error]
 *
 * This hook handles both lazy initialization AND resetting when dependencies change.
 * It replaces the need for useInitSafeCoreSDK in InitApp.
 * Components that need the SDK should use this hook.
 */
export const useEnsureSafeSDK = (): [Safe | undefined, boolean, Error | undefined] => {
  const { safe, safeLoaded } = useSafeInfo()
  const dispatch = useAppDispatch()
  const web3ReadOnly = useWeb3ReadOnly()

  const { query } = useRouter()
  const prefixedAddress = Array.isArray(query.safe) ? query.safe[0] : query.safe
  const { address } = parsePrefixedAddress(prefixedAddress || '')
  const undeployedSafe = useAppSelector((state) => selectUndeployedSafe(state, safe.chainId, address))

  const [sdk, isLoading, error] = useSafeSDK()

  // Track previous safe address to detect when it changes
  const prevSafeAddressRef = useRef<string | undefined>(undefined)

  // Effect 1: Reset SDK when safe/chain changes
  useEffect(() => {
    const currentSafeAddress = safe.address.value
    const prevSafeAddress = prevSafeAddressRef.current

    // Reset SDK if safe address changed
    if (prevSafeAddress && prevSafeAddress !== currentSafeAddress) {
      resetSafeSDK()
    }

    prevSafeAddressRef.current = currentSafeAddress
  }, [safe.address.value, safe.chainId])

  // Effect 2: Initialize SDK when needed
  useEffect(() => {
    // Don't initialize if dependencies aren't ready
    if (!safeLoaded || !web3ReadOnly || !sameAddress(address, safe.address.value)) {
      return
    }

    // If SDK is already initialized or loading, don't re-initialize
    if (sdk || isLoading) {
      return
    }

    // Trigger lazy initialization
    initializeSafeSDK({
      provider: web3ReadOnly,
      chainId: safe.chainId,
      address: safe.address.value,
      version: safe.version,
      implementationVersionState: safe.implementationVersionState,
      implementation: safe.implementation.value,
      undeployedSafe,
    }).catch((_e) => {
      const e = _e instanceof Error ? _e : new Error(String(_e))
      dispatch(
        showNotification({
          message: 'Error connecting to the blockchain. Please try reloading the page.',
          groupKey: 'core-sdk-init-error',
          variant: 'error',
          detailedMessage: e.message,
        }),
      )
      trackError(ErrorCodes._105, e.message)
    })
  }, [
    address,
    dispatch,
    isLoading,
    safe.address.value,
    safe.chainId,
    safe.implementation.value,
    safe.implementationVersionState,
    safe.version,
    safeLoaded,
    sdk,
    undeployedSafe,
    web3ReadOnly,
  ])

  // Show error notification only once when error occurs
  useEffect(() => {
    if (error) {
      dispatch(
        showNotification({
          message: 'Error initializing Safe SDK. Please try reloading the page.',
          groupKey: 'core-sdk-init-error',
          variant: 'error',
          detailedMessage: error.message,
        }),
      )
      trackError(ErrorCodes._105, error.message)
    }
  }, [error, dispatch])

  return [sdk, isLoading, error]
}
