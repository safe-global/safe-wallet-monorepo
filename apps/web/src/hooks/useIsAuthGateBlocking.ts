import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

/**
 * Whether the require-login gate is currently keeping the user out.
 *
 * Returns `true` when the gate is on (or still loading) AND the user has no
 * SIWE session. Callers use this to avoid rendering protected UI / wiring
 * background subscriptions for someone who is about to be bounced to
 * `/welcome/spaces`.
 *
 * We treat the loading state (`isRequireLoginEnabled === undefined`) as
 * blocking too — chains config can take up to ~1s, and during that window
 * the route guard hasn't decided yet. Treating it as "off" would let
 * protected pages mount and fire pending-tx toasts before the redirect.
 */
export const useIsAuthGateBlocking = (): boolean => {
  const isRequireLoginEnabled = useIsRequireLoginEnabled()
  const isSignedIn = useAppSelector(isAuthenticated)
  return isRequireLoginEnabled !== false && !isSignedIn
}
