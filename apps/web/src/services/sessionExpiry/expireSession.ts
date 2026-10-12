import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import type { AppThunk } from '@/store'
import { setUnauthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { AppRoutes } from '@/config/routes'

export const SESSION_EXPIRED_GROUP_KEY = 'session-expired'
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in to Workspaces again.'

export const isForbidden = (error: unknown): error is FetchBaseQueryError => getHttpStatusFromError(error) === 403

export const isSpacesRoute = (pathname: string): boolean =>
  pathname === AppRoutes.welcome.spaces || pathname === AppRoutes.spaces.index || pathname.startsWith('/spaces/')

// Clearing auth is what makes the router guard redirect; the toast is only shown on workspaces routes.
export const expireSession =
  (pathname: string): AppThunk =>
  (dispatch) => {
    dispatch(setUnauthenticated())
    if (!isSpacesRoute(pathname)) return
    dispatch(
      showNotification({
        message: SESSION_EXPIRED_MESSAGE,
        variant: 'info',
        autoHideDuration: null,
        groupKey: SESSION_EXPIRED_GROUP_KEY,
      }),
    )
  }
