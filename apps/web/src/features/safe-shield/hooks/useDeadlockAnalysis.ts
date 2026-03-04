import { useEffect, useRef, useState } from 'react'
import { useEffectDeepCompare } from '@safe-global/utils/features/safe-shield/hooks/util-hooks'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checkDeadlock } from '@safe-global/utils/features/safe-shield/utils'
import type { DeadlockCheckResult, SafeOwnerInfo } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { trackEvent, SETTINGS_EVENTS } from '@/services/analytics'
import useChainId from '@/hooks/useChainId'

const EMPTY_RESULT: AsyncResult<DeadlockCheckResult> = [undefined, undefined, false]

export function useDeadlockAnalysis(
  editedSafeAddress: string | undefined,
  projectedOwners: string[] | undefined,
  projectedThreshold: number | undefined,
): AsyncResult<DeadlockCheckResult> {
  const chainId = useChainId()
  const [result, setResult] = useState<DeadlockCheckResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()
  const prevResultRef = useRef<DeadlockCheckResult | undefined>(undefined)

  useEffectDeepCompare(() => {
    if (
      !editedSafeAddress ||
      !projectedOwners ||
      projectedOwners.length === 0 ||
      projectedThreshold === undefined ||
      !chainId
    ) {
      setResult(undefined)
      return
    }

    let isCurrent = true

    const run = async () => {
      isCurrent && setLoading(true)

      const safeOwnerInfos: SafeOwnerInfo[] = []

      const fetchPromises = projectedOwners.map(async (ownerAddress): Promise<SafeOwnerInfo | null> => {
        try {
          const response = await triggerGetSafe({ chainId, safeAddress: ownerAddress }).unwrap()
          const ownerAddresses = response.owners.map((o) => o.value)

          return {
            address: ownerAddress,
            owners: ownerAddresses,
            threshold: response.threshold,
            hasNestedSafes: false,
            fetchError: false,
          }
        } catch (error) {
          const isFetchError = error instanceof Error && error.message !== 'Not Found'
          if (isFetchError) {
            return {
              address: ownerAddress,
              owners: [],
              threshold: 0,
              hasNestedSafes: false,
              fetchError: true,
            }
          }
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      if (!isCurrent) return

      for (const info of results) {
        if (info) {
          safeOwnerInfos.push(info)
        }
      }

      if (safeOwnerInfos.length === 0) {
        setResult({ status: 'valid', hasDeepNesting: false, fetchFailures: [] })
        setLoading(false)
        return
      }

      const knownSafeAddresses = new Set(safeOwnerInfos.map((info) => info.address.toLowerCase()))
      knownSafeAddresses.add(editedSafeAddress.toLowerCase())

      await Promise.all(
        safeOwnerInfos
          .filter((info) => !info.fetchError)
          .map(async (info) => {
            const candidates = info.owners.filter((o) => !knownSafeAddresses.has(o.toLowerCase()))
            const checks = await Promise.all(
              candidates.map((nestedOwner) =>
                triggerGetSafe({ chainId, safeAddress: nestedOwner })
                  .unwrap()
                  .then(() => true)
                  .catch(() => false),
              ),
            )
            if (!isCurrent) return
            info.hasNestedSafes = checks.some(Boolean)
          }),
      )
      if (!isCurrent) return

      const deadlockResult = checkDeadlock(editedSafeAddress, projectedOwners, projectedThreshold, safeOwnerInfos)
      setResult(deadlockResult)
      setLoading(false)
    }

    run()

    return () => {
      isCurrent = false
    }
  }, [editedSafeAddress, projectedOwners, projectedThreshold, chainId, triggerGetSafe])

  useEffect(() => {
    if (!result || result === prevResultRef.current) return
    prevResultRef.current = result

    trackEvent(SETTINGS_EVENTS.DEADLOCK.CHECK_RUN)

    if (result.status === 'blocked') {
      trackEvent(SETTINGS_EVENTS.DEADLOCK.BLOCKED)
    }

    if (result.status === 'warning' || result.status === 'unknown') {
      trackEvent(SETTINGS_EVENTS.DEADLOCK.WARNING_SHOWN)
    }
  }, [result])

  if (!editedSafeAddress || !projectedOwners || projectedOwners.length === 0) {
    return EMPTY_RESULT
  }

  return [result, undefined, loading]
}
