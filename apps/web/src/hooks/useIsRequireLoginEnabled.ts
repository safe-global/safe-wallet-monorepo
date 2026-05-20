import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID, IS_TEST_E2E } from '@/config/constants'

/**
 * Whether the "must log in to Spaces" gate is active.
 *
 * The flag stored in chains config is REQUIRE_LOGIN_DISABLED — when the flag
 * is absent (default) the gate is ON; when explicitly enabled the gate is OFF.
 *
 * The gate applies to routes (welcome, login, dashboard) that have no active
 * chain context, so we always read the flag from the default chain rather
 * than `useCurrentChain()`. The flag is rolled out uniformly across all
 * chains, so this is also the simplest single source of truth.
 *
 * Cypress runs (IS_TEST_E2E) are forced OFF so the existing smoke / regression
 * suite doesn't have to know about the gate.
 *
 * Returns `undefined` while the chains config is still loading so that
 * callers can avoid redirecting before they know the answer.
 */
export const useIsRequireLoginEnabled = (): boolean | undefined => {
  const chain = useChain(String(DEFAULT_CHAIN_ID))

  if (IS_TEST_E2E) return false
  if (!chain) return undefined
  return !hasFeature(chain, FEATURES.REQUIRE_LOGIN_DISABLED)
}

export default useIsRequireLoginEnabled
