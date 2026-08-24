import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import reconcileAuth from '@/store/reconcileAuth'
import { STEP_UP_FAILED_MESSAGE } from '../constants'
import { stepUpReturning, stepUpSettled } from '../store'
import { markStepUpReturnHandled, resetStepUpReturnGuard } from '../utils/stepUp'
import { replayStepUpAction, takeStepUpTrip } from '../utils/stepUpReplay'

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
    // Consumed — read and deleted — before anything happens, so a record can
    // never be acted on twice, later, or by another trip. Absent or expired
    // records mean there is nothing to do.
    const trip = takeStepUpTrip()
    if (!trip) return

    hasProcessed.current = true
    // While this return is being processed, a replay that is itself rejected must
    // surface as an error rather than redirecting out again.
    markStepUpReturnHandled()
    // The first render races the replay: lists paint pre-mutation data until the
    // refetches land. The splash stays up until the world is consistent.
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

        params.delete('error')
        params.delete('error_description')
        const cleanQuery = Object.fromEntries(params.entries())
        routerRef.current.replace({ pathname: routerRef.current.pathname, query: cleanQuery }, undefined, {
          shallow: true,
        })
      } else {
        await reconcileAuth(dispatch)
        if (trip.action) await replayStepUpAction(dispatch, trip.action)
      }
    }

    // The guard covers only the processing above and must be released even when
    // it throws (e.g. the gateway was unreachable during the return). Left set,
    // it would swallow every later challenge in this tab until a full reload —
    // the second gated action of a session would fail with an inline error and
    // no redirect.
    void processCallback()
      .finally(() => {
        resetStepUpReturnGuard()
        dispatch(stepUpSettled())
      })
      // The next attempt surfaces the failure through its own error handling.
      .catch(() => undefined)
  }, [dispatch])
}
