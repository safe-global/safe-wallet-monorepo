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

  // Track previous safe configuration to detect when SDK-relevant properties change
  const prevSafeKeyRef = useRef<string | undefined>(undefined)

  // Effect 1: Reset SDK when safe/chain/version/implementation changes
  useEffect(() => {
    // Include all properties that should trigger SDK reset
    const currentSafeKey = [
      safe.chainId,
      safe.address.value,
      safe.version,
      safe.implementation.value,
      safe.implementationVersionState,
    ].join(':')

    const prevSafeKey = prevSafeKeyRef.current

    // Reset SDK if any SDK-relevant property changed
    if (prevSafeKey && prevSafeKey !== currentSafeKey) {
      resetSafeSDK()
    }

    prevSafeKeyRef.current = currentSafeKey
  }, [safe.address.value, safe.chainId, safe.version, safe.implementation.value, safe.implementationVersionState])

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

      // Don't show notification for intentional cancellations (e.g., when switching Safes or during re-renders)
      if (e.message === 'Initialization aborted') {
        return
      }

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

  return [sdk, isLoading, error]
}
