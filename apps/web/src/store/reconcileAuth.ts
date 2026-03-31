import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { setAuthenticated, setUnauthenticated } from '@/store/authSlice'
import type { AppDispatch } from '@/store'

export type ReconcileResult = 'authenticated' | 'unauthenticated' | 'error'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const isUnauthorized = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && (error as FetchBaseQueryError).status === 403

/**
 * Calls /v1/auth/me to check the current session and updates Redux auth state accordingly.
 * Returns `'authenticated'` if the session is valid, `'unauthenticated'` if the server
 * confirmed the session is invalid (403), or `'error'` for transient failures (network
 * errors, 5xx) which leave auth state unchanged.
 */
const reconcileAuth = async (dispatch: AppDispatch): Promise<ReconcileResult> => {
  try {
    await dispatch(cgwApi.endpoints.authGetMeV1.initiate()).unwrap()
    dispatch(setAuthenticated(Date.now() + ONE_DAY_MS))
    return 'authenticated'
  } catch (error) {
    if (isUnauthorized(error)) {
      dispatch(setUnauthenticated())
      return 'unauthenticated'
    }
    return 'error'
  }
}

export default reconcileAuth
