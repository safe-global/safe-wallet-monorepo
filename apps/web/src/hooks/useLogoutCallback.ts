import { useEffect, useRef } from 'react'
import { useAppDispatch } from '@/store'
import reconcileAuth from '@/store/reconcileAuth'
import { logError, Errors } from '@/services/exceptions'

export const LOGGING_OUT_KEY = 'logging_out'

/**
 * Reconciles auth state with the backend after a logout redirect.
 *
 * useLogout writes a flag to sessionStorage before the form submit navigates away.
 * After the redirect lands back in the app, this hook reads the flag and calls /v1/auth/me:
 *   - 200 → cookie still valid, restore authenticated state
 *   - 403 → cookie cleared, confirm unauthenticated
 */
export const useLogoutCallback = () => {
  const dispatch = useAppDispatch()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const isLoggingOut = sessionStorage.getItem(LOGGING_OUT_KEY)
    if (!isLoggingOut || hasProcessed.current) return
    hasProcessed.current = true

    const process = async () => {
      const result = await reconcileAuth(dispatch)

      if (result === 'error' || result === 'authenticated') {
        logError(Errors._109)
      }

      sessionStorage.removeItem(LOGGING_OUT_KEY)
    }

    void process()
  }, [dispatch])
}
