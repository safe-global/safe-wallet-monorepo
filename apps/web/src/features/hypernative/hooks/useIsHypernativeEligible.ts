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
 * The outreach probe is skipped when HYPERNATIVE is off on the chain. CGW
 * answers that route with a documented 404 ("Safe not targeted") for every
 * Safe outside the allowlist, and the browser writes that 404 to the console
 * itself — no client-side filter can suppress it (WA-2991). With the feature
 * off there are no Hypernative CTAs to gate, so the answer cannot change any
 * outcome and the request is pure console noise. This also makes the feature
 * flag a real precondition of `isHypernativeEligible`, which `useThreatAnalysis`,
 * `useNestedThreatAnalysis` and `useShowHypernativeAssessment` already AND in
 * by hand at every call site.
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
