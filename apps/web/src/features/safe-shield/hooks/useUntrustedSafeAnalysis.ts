import { useMemo, useCallback } from 'react'
import { Severity, SafeStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import useIsPinnedSafe from '@/hooks/useIsPinnedSafe'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useTrustSafe } from '@/features/myAccounts'

type UntrustedSafeAnalysisResult = {
  safeAnalysis: SafeAnalysisResult | null
  addToTrustedList: () => void
}

/**
 * Hook for analyzing if the current Safe is untrusted (not pinned).
 * Returns the analysis result and a function to add the Safe to the trusted list.
 */
const useUntrustedSafeAnalysis = (): UntrustedSafeAnalysisResult => {
  const isPinned = useIsPinnedSafe()
  const { safe, safeAddress } = useSafeInfo()
  const { trustSafe } = useTrustSafe()

  const safeAnalysis: SafeAnalysisResult | null = useMemo(() => {
    if (isPinned) return null
    return {
      severity: Severity.CRITICAL,
      type: SafeStatus.UNTRUSTED,
      title: 'Untrusted Safe',
      description:
        'You are creating this transaction from a Safe that is not in your trusted list. Verify that this Safe address is correct before proceeding.',
    }
  }, [isPinned])

  const addToTrustedList = useCallback(() => {
    const chainId = safe?.chainId
    if (!chainId || !safeAddress) return

    trustSafe({
      chainId,
      address: safeAddress,
      owners: safe?.owners,
      threshold: safe?.threshold,
    })
  }, [safe?.chainId, safe?.owners, safe?.threshold, safeAddress, trustSafe])

  return { safeAnalysis, addToTrustedList }
}

export default useUntrustedSafeAnalysis
