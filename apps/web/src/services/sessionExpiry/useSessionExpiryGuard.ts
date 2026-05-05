import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch, useAppSelector } from '@/store'
import { sessionExpired } from '@/store/sessionExpired'

const isExpired = (sessionExpiresAt: number | null): boolean =>
  sessionExpiresAt !== null && sessionExpiresAt <= Date.now()

/**
 * Preemptive client-side session-expiry guard.
 *
 * Runs on app mount and on every Next.js route change. If the locally-stored
 * sessionExpiresAt has elapsed, dispatches the sessionExpired thunk before the
 * destination page issues any backend calls — saving a needless 403 round-trip.
 *
 * The thunk is idempotent (early-exits when sessionExpiresAt is already null),
 * so this composes safely with the response-hook safety net.
 */
export const useSessionExpiryGuard = (): void => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const sessionExpiresAt = useAppSelector((state) => state.auth.sessionExpiresAt)

  // Mount-time check: if we boot up with an already-expired session,
  // clean it up before any pages render data.
  useEffect(() => {
    if (isExpired(sessionExpiresAt)) {
      dispatch(sessionExpired())
    }
    // Intentionally only on first mount — the routeChangeStart listener below
    // covers all subsequent transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      if (isExpired(sessionExpiresAt)) {
        dispatch(sessionExpired())
      }
    }

    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [dispatch, router.events, sessionExpiresAt])
}
