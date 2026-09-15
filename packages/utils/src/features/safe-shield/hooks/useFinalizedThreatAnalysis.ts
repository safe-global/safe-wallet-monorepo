import { useMemo } from 'react'
import type { JsonRpcProvider } from 'ethers'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { AnalysisResult, ThreatAnalysisResults } from '../types'
import { useGuardCheck } from './useGuardCheck'
import { dedupeAnalysisResults, pruneOkResults } from '../utils'

/**
 * Augments a threat-analysis result with a client-side `setGuard` interface check, merging any
 * invalid-guard finding into the THREAT group. THREAT and CUSTOM_CHECKS are then cleaned: duplicates
 * are removed and OK entries are dropped when other severity levels exist.
 *
 * @param threat - The threat-analysis result to augment
 * @param params - Guard-check inputs (transaction, Safe address/version, read-only provider)
 */
export function useFinalizedThreatAnalysis(
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
    const threat = guardResults?.length ? [...guardResults, ...(threatData?.THREAT ?? [])] : threatData?.THREAT
    if (!threatData && !threat) return undefined

    const clean = <T extends AnalysisResult>(items: T[]) => pruneOkResults(dedupeAnalysisResults(items))
    return {
      ...threatData,
      ...(threat && { THREAT: clean(threat) }),
      ...(threatData?.CUSTOM_CHECKS && { CUSTOM_CHECKS: clean(threatData.CUSTOM_CHECKS) }),
    }
  }, [threatData, guardResults])

  return [merged, threatError, threatLoading || guardLoading]
}
