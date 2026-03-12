import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useSiwe } from '@/services/siwe/useSiwe'
import { isAuthenticated, setAuthenticated } from '@/store/authSlice'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { showNotification } from '@/store/notificationsSlice'
import type { AppDispatch } from '@/store'

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000

interface UseSIWEAuthArgs {
  onSuccess: () => void
  onError?: (error: Error) => void
  skipSiwe?: boolean
}

/**
 * Attempts SIWE sign-in and dispatches the authenticated state.
 * Returns `true` if authentication succeeded, `false` if the user
 * rejected or the provider was unavailable.
 */
const performSignIn = async (signIn: ReturnType<typeof useSiwe>['signIn'], dispatch: AppDispatch): Promise<boolean> => {
  trackEvent({ ...SPACE_EVENTS.SIGN_IN_BUTTON, label: OVERVIEW_LABELS.welcome_page })

  const result = await signIn()

  if (result?.error) {
    throw result.error
  }

  if (!result) return false

  dispatch(setAuthenticated(Date.now() + ONE_DAY_IN_MS))
  return true
}

const handleAuthError = (error: unknown, dispatch: AppDispatch, onError?: (error: Error) => void) => {
  logError(ErrorCodes._640)
  onError?.(error as Error)

  dispatch(
    showNotification({
      message: 'Something went wrong while trying to sign in',
      variant: 'error',
      groupKey: 'sign-in-failed',
    }),
  )
}

export const useHomeAuth = ({ onSuccess, onError, skipSiwe }: UseSIWEAuthArgs) => {
  const dispatch = useAppDispatch()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const { signIn, loading } = useSiwe()

  const performAuth = useCallback(async () => {
    if (loading) return

    try {
      if (!isUserAuthenticated && !skipSiwe) {
        const didSignIn = await performSignIn(signIn, dispatch)
        if (!didSignIn) return
      }

      onSuccess()
    } catch (error) {
      handleAuthError(error, dispatch, onError)
    }
  }, [isUserAuthenticated, signIn, dispatch, onSuccess, onError, loading])

  return {
    performAuth,
    loading,
  }
}
