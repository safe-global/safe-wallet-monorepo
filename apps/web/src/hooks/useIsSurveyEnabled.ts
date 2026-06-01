import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

/**
 * Whether the Space onboarding survey is enabled.
 *
 * The flag stored in chains config is SURVEY_ONBOARDING_DISABLED — when the
 * flag is absent (default) the survey is ON; when explicitly enabled the
 * survey is OFF (emergency kill switch).
 *
 * The survey runs during Space onboarding before any chain is selected, so
 * we read the flag from the default chain rather than `useCurrentChain()`.
 * The flag is rolled out uniformly across all chains, so this is also the
 * simplest single source of truth.
 *
 * Returns `undefined` while the chains config is still loading so callers
 * can avoid redirecting before they know the answer.
 */
export const useIsSurveyEnabled = (): boolean | undefined => {
  const chain = useChain(String(DEFAULT_CHAIN_ID))
  if (!chain) return undefined
  return !hasFeature(chain, FEATURES.SURVEY_ONBOARDING_DISABLED)
}

export default useIsSurveyEnabled
