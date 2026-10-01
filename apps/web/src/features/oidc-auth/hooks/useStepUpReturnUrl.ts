import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet } from '../store'

/**
 * While mounted, a step-up started on this page returns the user to `returnUrl` instead of the
 * current page. Accepts an absolute URL or a path on the Safe app's origin.
 */
export const useStepUpReturnUrl = (returnUrl: string | undefined): void => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!returnUrl) return

    dispatch(stepUpReturnUrlSet(returnUrl))
    return () => {
      dispatch(stepUpReturnUrlCleared(returnUrl))
    }
  }, [dispatch, returnUrl])
}
