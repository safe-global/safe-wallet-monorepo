import Router from 'next/router'
import { AppRoutes } from '@/config/routes'
import type { AppThunk } from '@/store'
import { setUnauthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'

export const SESSION_EXPIRED_GROUP_KEY = 'session-expired'
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

/**
 * Thunk fired when an authenticated session is detected as no longer valid —
 * either preemptively (client-side timestamp check) or reactively (a 403 from
 * a credentialed endpoint).
 *
 * Idempotent: when no session is present, this is a no-op. The auth slice's
 * sessionExpiresAt field doubles as the de-dupe key — once cleared, parallel
 * 403s landing afterwards will short-circuit here without re-toasting or
 * re-navigating.
 */
export const sessionExpired = (): AppThunk => (dispatch, getState) => {
  const { sessionExpiresAt } = getState().auth
  if (sessionExpiresAt === null) return

  dispatch(setUnauthenticated())

  dispatch(
    showNotification({
      message: SESSION_EXPIRED_MESSAGE,
      variant: 'error',
      groupKey: SESSION_EXPIRED_GROUP_KEY,
    }),
  )

  Router.replace(AppRoutes.welcome.spaces)
}
