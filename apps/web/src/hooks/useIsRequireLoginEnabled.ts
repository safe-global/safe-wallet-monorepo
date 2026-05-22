import { useEffect, useState } from 'react'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { useChain } from '@/hooks/useChains'
import { DEFAULT_CHAIN_ID, IS_TEST_E2E } from '@/config/constants'
import { useIsClassicViewOptedIn } from '@/hooks/useClassicView'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

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
 * The classic-view escape hatch is a signed-out-only override: once a user has
 * opted in via /welcome/spaces, the gate stays OFF for the rest of the tab
 * session, but only while they remain signed out. Signing in re-engages the
 * gate so the post-login "no Spaces → onboarding" flow still triggers. The
 * override does NOT depend on the CLASSIC_VIEW_DISABLED flag — if a user
 * previously opted in and the flag is subsequently turned on, we still honour
 * their opt-in rather than yanking them back to the login page mid-flow.
 *
 * Returns `undefined` while the chains config is still loading so that
 * callers can avoid redirecting before they know the answer.
 */
export const useIsRequireLoginEnabled = (): boolean | undefined => {
  // useIsClassicViewOptedIn is backed by useSyncExternalStore, which returns
  // its server snapshot (always `false`) during hydration to avoid SSR
  // mismatches — the real sessionStorage value only kicks in after the first
  // effect tick. Without this gate, a logged-out user with classic-view
  // opt-in opening any deep link sees one render where the hook resolves to
  // `true`, which is enough for the route guard to fire a redirect to
  // /welcome/spaces before the opt-in flips. Returning `undefined` until the
  // first effect has run keeps the route guard's "still loading" branch in
  // control during that window.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const chain = useChain(String(DEFAULT_CHAIN_ID))
  const isClassicViewOptedIn = useIsClassicViewOptedIn()
  const isSignedIn = useAppSelector(isAuthenticated)

  if (IS_TEST_E2E) return false
  if (!isMounted) return undefined
  if (isClassicViewOptedIn && !isSignedIn) return false
  if (!chain) return undefined
  return !hasFeature(chain, FEATURES.REQUIRE_LOGIN_DISABLED)
}

export default useIsRequireLoginEnabled
