import { useEffect, useRef } from 'react'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { initSafeSDK, setSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import Logger from '@/src/utils/logger'

/**
 * Initializes the Safe Core SDK when safe data and web3 provider are available.
 *
 * Uses AbortController to prevent race conditions when dependencies change rapidly.
 *
 * Problem: When switching chains or safe addresses, useEffect can run multiple times
 * concurrently. Each run starts an async initSafeSDK operation. These operations can
 * complete in any order (e.g., a cached SDK returns immediately while a network call
 * takes longer). Without cancellation, a stale operation's result can overwrite the
 * current one, causing incorrect SDK state.
 *
 * Solution: Each effect run creates an AbortController and stores it in a ref. The
 * cleanup function aborts the previous controller when dependencies change. Async
 * operations check signal.aborted after completion and skip state updates if aborted.
 * This ensures only the latest effect's result updates the SDK state.
 *
 * Example race condition prevented:
 * - User switches from Polygon → Sepolia
 * - Effect #1 starts (Polygon, slow network call)
 * - Effect #2 starts (Sepolia, finds cached SDK, completes fast)
 * - Without abort: Effect #1 completes later, overwrites Sepolia SDK with Polygon SDK
 * - With abort: Effect #1 checks signal.aborted, skips update
 */
export const useInitSafeCoreSDK = () => {
  const { safe, safeLoaded } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const cleanup = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }

    if (!web3ReadOnly) {
      setSafeSDK(undefined)
      return cleanup
    }

    if (!safeLoaded || !safe.address.value || !safe.chainId) {
      return cleanup
    }

    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    const init = async () => {
      try {
        const safeSDK = await initSafeSDK({
          provider: web3ReadOnly,
          chainId: safe.chainId,
          address: safe.address.value,
          version: safe.version,
          implementationVersionState: safe.implementationVersionState,
          implementation: safe.implementation.value,
        })

        if (signal.aborted) {
          return
        }

        if (safeSDK === undefined) {
          Logger.warn('initSafeSDK returned undefined', {
            chainId: safe.chainId,
            address: safe.address.value,
            providerUrl: web3ReadOnly._getConnection().url,
          })
        } else {
          Logger.info('safe sdk initialized', safeSDK)
        }
        setSafeSDK(safeSDK)
      } catch (_e) {
        if (signal.aborted) {
          return
        }
        setSafeSDK(undefined)
        const e = asError(_e)
        Logger.error('error init', e)
      }
    }

    init()

    return cleanup
  }, [
    safe?.address?.value,
    safe?.chainId,
    safe?.implementation?.value,
    safe?.implementationVersionState,
    safe?.version,
    safeLoaded,
    web3ReadOnly,
  ])
}
