import { useMemo, useCallback } from 'react'
import { Severity, SafeStatus } from '@safe-global/utils/features/safe-shield/types'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import useIsTrustedSafe from '@/hooks/useIsTrustedSafe'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useTrustSafe } from '@/features/myAccounts'

type UntrustedSafeAnalysisResult = {
  safeAnalysis: SafeAnalysisResult | null
  addToTrustedList: () => void
}

/**
 * Hook for analyzing if the current Safe is untrusted.
 * A Safe is trusted if it's either pinned or curated as a nested safe.
 * Returns the analysis result and a function to add the Safe to the trusted list.
 */
const useUntrustedSafeAnalysis = (): UntrustedSafeAnalysisResult => {
  const isTrusted = useIsTrustedSafe()
  const { safe, safeAddress } = useSafeInfo()
  const { trustSafe } = useTrustSafe()

  const safeAnalysis: SafeAnalysisResult | null = useMemo(() => {
    if (isTrusted) return null
    return {
      severity: Severity.CRITICAL,
      type: SafeStatus.UNTRUSTED,
      title: 'Untrusted Safe',
      description:
        "You're creating a transaction from a Safe that isn't in your trusted list. Trust it if you recognize it.",
    }
  }, [isTrusted])

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
