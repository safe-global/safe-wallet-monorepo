import { useState } from 'react'
import { useEffectDeepCompare } from '@safe-global/utils/features/safe-shield/hooks/util-hooks'
import { useLazySafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checkDeadlock } from '@safe-global/utils/features/safe-shield/utils'
import {
  DeadlockStatus,
  type DeadlockCheckResult,
  type SafeOwnerInfo,
} from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'

type TriggerGetSafe = ReturnType<typeof useLazySafesGetSafeV1Query>[0]

const EMPTY_RESULT: AsyncResult<DeadlockCheckResult> = [undefined, undefined, false]

async function fetchSafeOwnerInfos(
  owners: string[],
  triggerGetSafe: TriggerGetSafe,
  chainId: string,
): Promise<SafeOwnerInfo[]> {
  const results = await Promise.all(
    owners.map(async (ownerAddress): Promise<SafeOwnerInfo | null> => {
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
      } catch (error: unknown) {
        // 404 means the address is not a Safe (it's an EOA) — expected, skip it
        const isNotFound =
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status: unknown }).status === 404
        if (isNotFound) {
          return null
        }
        // Any other error (network, server, etc.) is a genuine fetch failure
        return {
          address: ownerAddress,
          owners: [],
          threshold: 0,
          hasNestedSafes: false,
          fetchError: true,
        }
      }
    }),
  )
  return results.filter((info): info is SafeOwnerInfo => info !== null)
}

async function checkNestedSafes(
  safeOwnerInfos: SafeOwnerInfo[],
  knownSafeAddresses: Set<string>,
  triggerGetSafe: TriggerGetSafe,
  chainId: string,
): Promise<void> {
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
        info.hasNestedSafes = checks.some(Boolean)
      }),
  )
}

export function useDeadlockAnalysis(
  editedSafeAddress: string | undefined,
  projectedOwners: string[] | undefined,
  projectedThreshold: number | undefined,
): AsyncResult<DeadlockCheckResult> {
  const chainId = useChainId()
  const [result, setResult] = useState<DeadlockCheckResult | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [triggerGetSafe] = useLazySafesGetSafeV1Query()

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
      setLoading(true)

      try {
        const safeOwnerInfos = await fetchSafeOwnerInfos(projectedOwners, triggerGetSafe, chainId)
        if (!isCurrent) return

        if (safeOwnerInfos.length === 0) {
          setResult({ status: DeadlockStatus.VALID, hasDeepNesting: false, fetchFailures: [] })
          return
        }

        const knownSafeAddresses = new Set(safeOwnerInfos.map((info) => info.address.toLowerCase()))
        knownSafeAddresses.add(editedSafeAddress.toLowerCase())

        await checkNestedSafes(safeOwnerInfos, knownSafeAddresses, triggerGetSafe, chainId)
        if (!isCurrent) return

        const deadlockResult = checkDeadlock(editedSafeAddress, projectedOwners, projectedThreshold, safeOwnerInfos)
        setResult(deadlockResult)
      } catch {
        if (!isCurrent) return
        setResult({ status: DeadlockStatus.UNKNOWN, hasDeepNesting: false, fetchFailures: [] })
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    run()

    return () => {
      isCurrent = false
    }
  }, [editedSafeAddress, projectedOwners, projectedThreshold, chainId, triggerGetSafe])

  if (!editedSafeAddress || !projectedOwners || projectedOwners.length === 0) {
    return EMPTY_RESULT
  }

  return [result, undefined, loading]
}
