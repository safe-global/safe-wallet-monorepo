import { useEffect } from 'react'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import { initializeSafeSDK, useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
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
 * This hook should be used by components that need the SDK.
 * It will trigger lazy initialization on first mount if the SDK isn't ready yet.
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

  useEffect(() => {
    // Only initialize if all dependencies are valid and SDK is not already initialized/loading
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
