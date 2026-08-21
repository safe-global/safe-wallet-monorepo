import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import reconcileAuth from '@/store/reconcileAuth'
import { STEP_UP_FAILED_MESSAGE, STEP_UP_PENDING_KEY } from '../constants'
import { stepUpReturning, stepUpSettled } from '../store'
import { markStepUpReturnHandled } from '../utils/stepUp'
import { clearPendingStepUpAction, replayPendingStepUpAction } from '../utils/stepUpReplay'

/**
 * Handles the return leg of a step-up authentication redirect.
 *
 * CGW has already replaced the session cookie with an elevated one by the time
 * the browser lands back here, so there is nothing to exchange — but the new
 * cookie carries a new expiry, so the session is reconciled to keep Redux in
 * step. The step-up prompt is cleared either way: on success it is satisfied,
 * and on failure the user is told what happened rather than left looking at a
 * dialog that no longer reflects an in-flight request.
 *
 * Should be called once globally (from `InitApp`) so it runs on page load.
 */
export const useStepUpCallback = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const routerRef = useRef(router)
  const hasProcessed = useRef(false)

  routerRef.current = router

  useEffect(() => {
    if (hasProcessed.current) return
    if (!sessionStorage.getItem(STEP_UP_PENDING_KEY)) return

    hasProcessed.current = true
    sessionStorage.removeItem(STEP_UP_PENDING_KEY)
    // The challenge for this page load is spent; a replay that is itself rejected
    // must surface as an error rather than redirecting out again.
    markStepUpReturnHandled()
    dispatch(stepUpReturning())

    const processCallback = async () => {
      // Read from `window.location` rather than `router.query`, which can still
      // be empty before `router.isReady` on the first render.
      const params = new URLSearchParams(window.location.search)

      if (params.has('error')) {
        dispatch(
          showNotification({
            message: STEP_UP_FAILED_MESSAGE,
            variant: 'error',
            groupKey: 'step-up-failed',
          }),
        )

        // The challenge was not met, so the interrupted action must not run.
        clearPendingStepUpAction()

        params.delete('error')
        params.delete('error_description')
        const cleanQuery = Object.fromEntries(params.entries())
        routerRef.current.replace({ pathname: routerRef.current.pathname, query: cleanQuery }, undefined, {
          shallow: true,
        })
      } else {
        await reconcileAuth(dispatch)
        await replayPendingStepUpAction(dispatch)
      }

      dispatch(stepUpSettled())
    }

    void processCallback()
  }, [dispatch])
}
