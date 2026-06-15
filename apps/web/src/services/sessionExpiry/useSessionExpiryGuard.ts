import { useEffect, useRef } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectIsStoreHydrated, setUnauthenticated } from '@/store/authSlice'
import { closeByGroupKey, showNotification } from '@/store/notificationsSlice'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'
import { AppRoutes } from '@/config/routes'

// Mirrors apps/web/src/features/oidc-auth/constants.ts. The constant is not
// exported from the feature's public API; duplicating the literal here avoids
// pulling the (lazy-loaded) feature module into the boot path.
const OIDC_AUTH_PENDING_KEY = 'oidc_auth_pending'

export const SESSION_EXPIRED_GROUP_KEY = 'session-expired'
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in to workspaces again.'
export const SESSION_EXPIRED_SIGN_IN_LABEL = 'Sign in to workspaces'

const isForbidden = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 403

/**
 * Detects an expired session and clears Redux auth state so components stop
 * issuing credentialed requests that would otherwise 403.
 *
 * On boot (after store hydration), when the persisted state says the user is
 * signed in:
 *  1. If `sessionExpiresAt` has already passed → clear auth + toast immediately,
 *     no /v1/auth/me round-trip.
 *  2. Otherwise → arm a local-expiry timer for the remaining lifetime so a
 *     session that crosses `sessionExpiresAt` mid-tab is cleared without any
 *     further network request, even if the probe is slow or skipped.
 *  3. In parallel, fire exactly one /v1/auth/me probe to detect cookies that
 *     expired earlier than the persisted hint suggests. 403 → clear auth + toast
 *     immediately (overrides the timer); 200 / transient error → leave the timer
 *     to fire when local expiry passes.
 *
 * The /me probe is suppressed while OIDC login or logout callback flows are
 * processing — those hooks already call /me themselves. The local timer is
 * **not** suppressed: we still want sessionExpiresAt enforced even if the
 * surrounding flow finishes silently without dispatching an auth-state change.
 */
export const useSessionExpiryGuard = (): void => {
  const dispatch = useAppDispatch()
  const isHydrated = useAppSelector(selectIsStoreHydrated)
  const sessionExpiresAt = useAppSelector((state) => state.auth.sessionExpiresAt)

  // Track which sessionExpiresAt value we've already processed so that
  // unrelated re-renders (e.g. dispatch identity churn under React Strict Mode)
  // don't re-fire the /me probe. Cleared when the user signs out so a
  // subsequent sign-in within the same tab is processed afresh.
  const lastProcessedRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isHydrated) return
    if (sessionExpiresAt === null) {
      lastProcessedRef.current = null
      return
    }
    if (lastProcessedRef.current === sessionExpiresAt) return
    lastProcessedRef.current = sessionExpiresAt

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const expireNow = () => {
      dispatch(setUnauthenticated())
      dispatch(
        showNotification({
          message: SESSION_EXPIRED_MESSAGE,
          variant: 'error',
          groupKey: SESSION_EXPIRED_GROUP_KEY,
          link: { href: AppRoutes.welcome.spaces, title: SESSION_EXPIRED_SIGN_IN_LABEL },
        }),
      )
    }

    // Pre-flight: cookie is already past local expiry → no point arming the
    // timer or probing /me, just clear immediately.
    if (sessionExpiresAt <= Date.now()) {
      expireNow()
      return
    }

    // We have a fresh, future expiry — meaning the user is (re-)authenticated.
    // Dismiss any lingering session-expired toast left over from a prior expiry
    // in the same tab so it doesn't hang around after the user signs back in.
    dispatch(closeByGroupKey({ groupKey: SESSION_EXPIRED_GROUP_KEY }))

    // Arm the local-expiry timer up front. This is the floor on cleanup
    // latency: even if the /me probe hangs or is suppressed (OIDC/logout flow
    // owns /me), the session is guaranteed to be cleared at sessionExpiresAt.
    timer = setTimeout(expireNow, sessionExpiresAt - Date.now())

    // Suppress the probe while OIDC login or logout callback flows are
    // processing. Both flags are set *synchronously before a full-page redirect*
    // (useLogout.ts / useOidcLogin.ts), so on the return load they're guaranteed
    // to be present. They're cleared only after the callback's async /me
    // resolves and dispatches an auth-state change, which triggers this effect
    // to re-run via the sessionExpiresAt dep.
    const inFlow = sessionStorage.getItem(LOGGING_OUT_KEY) || sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)
    if (inFlow) {
      return () => {
        cancelled = true
        if (timer !== undefined) clearTimeout(timer)
      }
    }

    const probe = dispatch(authApi.endpoints.authGetMeV1.initiate())
    probe
      .unwrap()
      .catch((error: unknown) => {
        if (cancelled) return
        // 403 → cookie is gone; expire now (the timer is also cleared in
        // cleanup, but expireNow's setUnauthenticated triggers a re-render
        // with sessionExpiresAt=null which will run the cleanup anyway).
        if (isForbidden(error)) expireNow()
        // Transient (5xx / network): we have no proof the cookie is invalid;
        // fall through and let the timer enforce local expiry.
      })
      .finally(() => {
        probe.unsubscribe()
      })

    return () => {
      cancelled = true
      if (timer !== undefined) clearTimeout(timer)
    }
  }, [dispatch, isHydrated, sessionExpiresAt])
}
