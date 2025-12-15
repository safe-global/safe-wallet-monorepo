import { useThreatAnalysis as useThreatAnalysisUtils } from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useNestedTransaction } from '../components/useNestedTransaction'
import { useCurrentChain } from '@/hooks/useChains'

export function useThreatAnalysis(overrideSafeTx?: SafeTransaction) {
  const {
    safe: { chainId, version },
    safeAddress,
  } = useSafeInfo()
  const signer = useSigner()
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const walletAddress = signer?.address ?? ''
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  const chain = useCurrentChain()
  const txToAnalyze = overrideSafeTx || safeTx || safeMessage

  const safeTxToCheck = (txToAnalyze && 'data' in txToAnalyze ? txToAnalyze : undefined) as SafeTransaction | undefined
  const { nestedSafeInfo, nestedSafeTx, isNested } = useNestedTransaction(safeTxToCheck, chain)

  const mainThreatAnalysis = useThreatAnalysisUtils({
    safeAddress: safeAddress as `0x${string}`,
    chainId,
    data: txToAnalyze,
    walletAddress,
    origin: txOrigin,
    safeVersion: version || undefined,
  })

  const nestedThreatAnalysis = useThreatAnalysisUtils({
    safeAddress: (nestedSafeInfo?.address.value ?? safeAddress) as `0x${string}`,
    chainId,
    data: isNested ? nestedSafeTx : undefined,
    walletAddress,
    origin: txOrigin,
    safeVersion: nestedSafeInfo?.version ?? version ?? undefined,
  })

  const combinedThreatAnalysis = useMemo((): AsyncResult<ThreatAnalysisResults> => {
    const [mainResult, mainError, mainLoading] = mainThreatAnalysis
    const [nestedResult, nestedError, nestedLoading] = nestedThreatAnalysis

    if (!isNested) {
      return mainThreatAnalysis
    }

    const combinedResult: ThreatAnalysisResults | undefined = mainResult
      ? {
          ...mainResult,
          THREAT: [...(mainResult.THREAT || []), ...(nestedResult?.THREAT || [])],
        }
      : nestedResult

    return [combinedResult, mainError || nestedError, mainLoading || nestedLoading]
  }, [mainThreatAnalysis, nestedThreatAnalysis, isNested])

  // If HN Guard is installed, return a static INFO status.
  // This is a temporary solution to avoid the error message "Threat analysis failed"
  // when HN Guard is installed.
  if (HNGuardCheckLoading) {
    return [undefined, undefined, true] as AsyncResult<ThreatAnalysisResults>
  }
  if (isHypernativeGuard) {
    return [
      {
        [StatusGroup.THREAT]: [
          {
            severity: Severity.INFO,
            type: ThreatStatus.HYPERNATIVE_GUARD,
            title: 'Threat analysis on Hypernative',
            description: 'The full threat report is available in your Hypernative account',
          },
        ],
      },
      undefined,
      false,
    ] as AsyncResult<ThreatAnalysisResults>
  }

  return combinedThreatAnalysis
}
