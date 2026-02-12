import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { useSiwe } from '@/services/siwe/useSiwe'
import { isAuthenticated, setAuthenticated } from '@/store/authSlice'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { showNotification } from '@/store/notificationsSlice'

interface UseSIWEAuthArgs {
  onSuccess: () => void
  onError?: (error: Error) => void
}

export const useHomeAuth = ({ onSuccess, onError }: UseSIWEAuthArgs) => {
  const dispatch = useAppDispatch()
  const isUserAuthenticated = useAppSelector(isAuthenticated)
  const { signIn, loading } = useSiwe()

  const performAuth = useCallback(async () => {
    if (loading) return

    try {
      // Skip SIWE if already authenticated
      if (!isUserAuthenticated) {
        trackEvent({ ...SPACE_EVENTS.SIGN_IN_BUTTON, label: OVERVIEW_LABELS.welcome_page })
        const result = await signIn()

        if (result && result.error) {
          throw result.error
        }

        if (!result) {
          // User rejected or provider unavailable — stay on welcome
          return
        }

        const oneDayInMs = 24 * 60 * 60 * 1000
        dispatch(setAuthenticated(Date.now() + oneDayInMs))
      }

      onSuccess()
    } catch (error) {
      logError(ErrorCodes._640)

      if (onError) {
        onError(error as Error)
      }

      dispatch(
        showNotification({
          message: 'Something went wrong while trying to sign in',
          variant: 'error',
          groupKey: 'sign-in-failed',
        }),
      )
    }
  }, [isUserAuthenticated, signIn, dispatch, onSuccess, onError, loading])

  return {
    performAuth,
    loading,
  }
}
