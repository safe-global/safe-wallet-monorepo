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

  // Runs on mount, after store hydration populates a persisted sessionExpiresAt,
  // and on every Next.js route change. The thunk is idempotent so duplicate
  // dispatches across the mount/hydrate/route paths are safe.
  useEffect(() => {
    if (isExpired(sessionExpiresAt)) {
      dispatch(sessionExpired())
    }

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
