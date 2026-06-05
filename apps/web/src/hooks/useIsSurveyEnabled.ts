import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'

/**
 * Whether the Space onboarding survey is enabled.
 *
 * Gated on the SPACE_ONBOARDING_SURVEY chain-config flag — the survey is
 * only shown when the flag is present in the chain's features array. The
 * default is OFF; the config service has to opt each environment in.
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
  return hasFeature(chain, FEATURES.SPACE_ONBOARDING_SURVEY)
}

export default useIsSurveyEnabled
