import {
  useThreatAnalysis as useThreatAnalysisUtils,
  useThreatAnalysisHypernative,
} from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsHypernativeEligible, useIsHypernativeFeatureEnabled } from '@/features/hypernative'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useNestedTransaction } from '../components/useNestedTransaction'
import { useCurrentChain } from '@/hooks/useChains'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import { useNestedThreatAnalysis } from './useNestedThreatAnalysis'

export function useThreatAnalysis(
  overrideSafeTx?: SafeTransaction,
  hypernativeAuthToken?: string,
): AsyncResult<ThreatAnalysisResults> {
  const {
    safe: { chainId, version },
    safeAddress,
  } = useSafeInfo()
  const signer = useSigner()
  const { safeTx, safeMessage, txOrigin } = useContext(SafeTxContext)
  const walletAddress = signer?.address ?? ''
  const isHypernativeFeatureEnabled = useIsHypernativeFeatureEnabled()
  const { isHypernativeEligible, loading: eligibilityLoading } = useIsHypernativeEligible()

  // Hypernative analysis requires feature to be enabled AND eligibility
  const useHypernativeAnalysis = isHypernativeFeatureEnabled && isHypernativeEligible

  const chain = useCurrentChain()
  const txToAnalyze = overrideSafeTx || safeTx || safeMessage

  const safeTxToCheck = (txToAnalyze && 'data' in txToAnalyze ? txToAnalyze : undefined) as SafeTransaction | undefined
  const { isNested, isNestedLoading } = useNestedTransaction(safeTxToCheck, chain)

  const mainTxProps = useMemo(
    () => ({
      safeAddress: safeAddress as `0x${string}`,
      chainId,
      data: txToAnalyze,
      walletAddress,
      origin: txOrigin,
      safeVersion: version || undefined,
    }),
    [safeAddress, chainId, txToAnalyze, walletAddress, txOrigin, version],
  )

  const blockaidThreatAnalysis = useThreatAnalysisUtils({
    ...mainTxProps,
    skip: useHypernativeAnalysis || eligibilityLoading,
  })

  const hypernativeThreatAnalysis = useThreatAnalysisHypernative({
    ...mainTxProps,
    authToken: hypernativeAuthToken,
    skip: !useHypernativeAnalysis || !hypernativeAuthToken,
  })

  const threatAnalysis = useMemo(
    (): AsyncResult<ThreatAnalysisResults> =>
      useHypernativeAnalysis ? hypernativeThreatAnalysis : blockaidThreatAnalysis,
    [useHypernativeAnalysis, hypernativeThreatAnalysis, blockaidThreatAnalysis],
  )

  const nestedThreatAnalysis = useNestedThreatAnalysis(safeTxToCheck, hypernativeAuthToken)

  const combinedThreatAnalysis = useMemo((): AsyncResult<ThreatAnalysisResults> => {
    const [mainResult, mainError, mainLoading] = threatAnalysis
    const [nestedResult, nestedError, nestedLoading] = nestedThreatAnalysis

    if (eligibilityLoading) {
      return [undefined, undefined, true]
    }

    if (isNestedLoading) {
      return [mainResult, mainError, true]
    }

    if (!isNested) {
      return threatAnalysis
    }

    const combinedResult: ThreatAnalysisResults | undefined = mainResult
      ? {
          ...mainResult,
          THREAT: [...(mainResult.THREAT || []), ...(nestedResult?.THREAT || [])],
          CUSTOM_CHECKS: [...(mainResult.CUSTOM_CHECKS || []), ...(nestedResult?.CUSTOM_CHECKS || [])],
        }
      : nestedResult

    return [combinedResult, mainError || nestedError, mainLoading || nestedLoading]
  }, [threatAnalysis, nestedThreatAnalysis, isNested, isNestedLoading, eligibilityLoading])

  return combinedThreatAnalysis
}
