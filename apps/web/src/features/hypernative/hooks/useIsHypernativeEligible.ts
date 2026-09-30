import { useIsOutreachSafe } from '@/features/targeted-features'
import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { HYPERNATIVE_ALLOWLIST_OUTREACH_ID } from '../constants'

export type HypernativeEligibility = {
  isHypernativeEligible: boolean
  isHypernativeGuard: boolean
  isAllowlistedSafe: boolean
  loading: boolean
}

/**
 * Determines whether the current Safe is eligible for Hypernative CTAs.
 * Eligibility requires a Hypernative guard installed or targeted outreach membership.
 *
 * With HYPERNATIVE off on the chain there are no CTAs to gate, so the outreach
 * probe is skipped and the flag becomes a real precondition of eligibility —
 * previously every caller had to AND it in by hand (WA-2991).
 */
export const useIsHypernativeEligible = (): HypernativeEligibility => {
  const isEnabled = useIsHypernativeFeature()
  const { isHypernativeGuard, loading: guardLoading } = useIsHypernativeGuard()
  const { isTargeted: isAllowlistedSafe, loading: outreachLoading } = useIsOutreachSafe(
    HYPERNATIVE_ALLOWLIST_OUTREACH_ID,
    { skip: !isEnabled },
  )

  return {
    isHypernativeEligible: isHypernativeGuard || isAllowlistedSafe,
    isHypernativeGuard,
    isAllowlistedSafe,
    loading: guardLoading || outreachLoading,
  }
}
