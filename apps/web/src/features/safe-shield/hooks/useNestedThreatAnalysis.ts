import {
  useThreatAnalysis as useThreatAnalysisUtils,
  useThreatAnalysisHypernative,
} from '@safe-global/utils/features/safe-shield/hooks'
import { useSigner } from '@/hooks/wallets/useWallet'
import { useContext, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useNestedTransaction } from '../components/useNestedTransaction'
import { useCurrentChain } from '@/hooks/useChains'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'

/**
 * Hook for fetching threat analysis data for a nested Safe transaction
 * @param overrideSafeTx - The Safe transaction to analyze
 * @param hypernativeAuthToken - The Hypernative authentication token
 * @returns AsyncResult containing threat analysis results with loading and error states
 */
export function useNestedThreatAnalysis(
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
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  const chain = useCurrentChain()
  const txToAnalyze = overrideSafeTx || safeTx || safeMessage

  const safeTxToCheck = (txToAnalyze && 'data' in txToAnalyze ? txToAnalyze : undefined) as SafeTransaction | undefined
  const { nestedSafeInfo, nestedSafeTx, isNested } = useNestedTransaction(safeTxToCheck, chain)

  const nestedTxProps = useMemo(
    () => ({
      safeAddress: (nestedSafeInfo?.address.value ?? safeAddress) as `0x${string}`,
      chainId,
      data: isNested ? nestedSafeTx : undefined,
      walletAddress,
      origin: txOrigin,
      safeVersion: nestedSafeInfo?.version ?? version ?? undefined,
    }),
    [nestedSafeInfo, safeAddress, chainId, isNested, nestedSafeTx, walletAddress, txOrigin, version],
  )

  const nestedBlockaidAnalysis = useThreatAnalysisUtils({
    ...nestedTxProps,
    skip: isHypernativeGuard || !isNested,
  })

  const nestedHypernativeAnalysis = useThreatAnalysisHypernative({
    ...nestedTxProps,
    authToken: hypernativeAuthToken,
    skip: !isHypernativeGuard || !hypernativeAuthToken || !isNested,
  })

  if (!isNested) {
    return [undefined, undefined, false]
  }

  if (HNGuardCheckLoading) {
    return [undefined, undefined, true]
  }

  if (isHypernativeGuard) {
    return nestedHypernativeAnalysis
  }

  return nestedBlockaidAnalysis
}
