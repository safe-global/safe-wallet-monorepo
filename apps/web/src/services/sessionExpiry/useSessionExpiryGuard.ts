import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectIsStoreHydrated, setUnauthenticated } from '@/store/authSlice'
import { closeByGroupKey, showNotification } from '@/store/notificationsSlice'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'
import { AppRoutes } from '@/config/routes'

// Mirrors oidc-auth/constants.ts — duplicated here to avoid pulling the lazy feature module into the boot path.
const OIDC_AUTH_PENDING_KEY = 'oidc_auth_pending'

export const SESSION_EXPIRED_GROUP_KEY = 'session-expired'
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in to workspaces again.'

const isForbidden = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' && error !== null && 'status' in error && error.status === 403

const isSpacesRoute = (pathname: string): boolean =>
  pathname === AppRoutes.welcome.spaces || pathname === AppRoutes.spaces.index || pathname.startsWith('/spaces/')

/**
 * Detects an expired session and clears Redux auth state so components stop issuing 403-bound requests.
 *
 * On boot, if the persisted state says signed-in: clear immediately if `sessionExpiresAt` already passed;
 * otherwise arm a local-expiry timer (fires without any network request) and fire one /v1/auth/me probe —
 * a 403 clears immediately and overrides the timer; 200/transient leaves the timer to enforce local expiry.
 *
 * The probe (not the timer) is suppressed during OIDC login/logout flows, which call /me themselves.
 * Auth is cleared on every route; the toast shows only on workspaces routes.
 */
export const useSessionExpiryGuard = (): void => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isHydrated = useAppSelector(selectIsStoreHydrated)
  const sessionExpiresAt = useAppSelector((state) => state.auth.sessionExpiresAt)

  // Ref so expiry reads the pathname at fire-time without re-arming the effect.
  const pathnameRef = useRef(router.pathname)
  pathnameRef.current = router.pathname

  // Track the processed sessionExpiresAt so unrelated re-renders (e.g. Strict Mode dispatch churn) don't
  // re-fire the /me probe. Cleared on sign-out so a re-sign-in in the same tab is processed afresh.
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
      if (!isSpacesRoute(pathnameRef.current)) return
      dispatch(
        showNotification({
          message: SESSION_EXPIRED_MESSAGE,
          variant: 'info',
          // Keep until dismissed — info toasts otherwise auto-hide after 5s.
          autoHideDuration: null,
          groupKey: SESSION_EXPIRED_GROUP_KEY,
        }),
      )
    }

    // Already past local expiry → clear immediately, no timer or /me probe.
    if (sessionExpiresAt <= Date.now()) {
      expireNow()
      return
    }

    // A fresh future expiry means the user is (re-)authenticated: dismiss any lingering session-expired
    // toast from a prior expiry in the same tab.
    dispatch(closeByGroupKey({ groupKey: SESSION_EXPIRED_GROUP_KEY }))

    // Arm the local-expiry timer up front: even if the /me probe hangs or is suppressed, the session is
    // guaranteed to clear at sessionExpiresAt.
    timer = setTimeout(expireNow, sessionExpiresAt - Date.now())

    // Suppress the probe during OIDC-login/logout flows (they call /me themselves). Both flags are set
    // synchronously before a full-page redirect, so they're present on the return load, and cleared only
    // once the callback's /me dispatches an auth-state change — re-running this effect via sessionExpiresAt.
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
        // 403 → cookie is gone, expire now.
        if (isForbidden(error)) expireNow()
        // Transient (5xx / network): no proof the cookie is invalid, so let the timer enforce local expiry.
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
