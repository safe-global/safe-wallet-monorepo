import { useMemo } from 'react'
import type { JsonRpcProvider } from 'ethers'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { ThreatAnalysisResults } from '../types'
import { useGuardCheck } from './useGuardCheck'

/**
 * Augments a threat-analysis result with a client-side `setGuard` interface check, merging any
 * invalid-guard finding into the THREAT group.
 *
 * @param threat - The threat-analysis result to augment
 * @param params - Guard-check inputs (transaction, Safe address/version, read-only provider)
 */
export function useThreatAnalysisWithGuard(
  threat: AsyncResult<ThreatAnalysisResults> | undefined,
  {
    safeTx,
    safeAddress,
    safeVersion,
    web3ReadOnly,
  }: {
    safeTx?: SafeTransaction
    safeAddress?: string
    safeVersion?: string | null
    web3ReadOnly?: JsonRpcProvider
  },
): AsyncResult<ThreatAnalysisResults> {
  const [guardResults, , guardLoading] = useGuardCheck({ safeTx, safeAddress, safeVersion, web3ReadOnly })
  const [threatData, threatError, threatLoading = false] = threat ?? [undefined, undefined, false]

  const merged = useMemo<ThreatAnalysisResults | undefined>(() => {
    if (!guardResults?.length) {
      return threatData
    }
    return { ...(threatData ?? {}), THREAT: [...guardResults, ...(threatData?.THREAT ?? [])] }
  }, [threatData, guardResults])

  return [merged, threatError, threatLoading || guardLoading]
}
