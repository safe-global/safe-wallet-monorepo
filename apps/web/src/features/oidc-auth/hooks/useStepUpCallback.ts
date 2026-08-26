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
 * Handles the return leg of a step-up redirect. CGW has already replaced the
 * session cookie by the time the browser lands here, so there is nothing to
 * exchange — only a new expiry to reconcile into Redux.
 *
 * Call once globally, from `InitApp`, so it runs on page load.
 */
export const useStepUpCallback = () => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const routerRef = useRef(router)
  const hasProcessed = useRef(false)

  routerRef.current = router

  useEffect(() => {
    if (hasProcessed.current) return

    const trip = takeStepUpTrip()
    if (!trip) return

    hasProcessed.current = true
    markStepUpReturnHandled()
    // Held until the replay's refetches land, or lists paint pre-mutation data
    // next to a success toast and then visibly jump.
    dispatch(stepUpReturning())

    const processCallback = async () => {
      // `router.query` can still be empty before `router.isReady` on first render.
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

    // Released even on a throw — left set, it suppresses every later challenge
    // in the tab until a full reload.
    void processCallback()
      .finally(() => {
        resetStepUpReturnGuard()
        dispatch(stepUpSettled())
      })
      .catch(() => undefined)
  }, [dispatch])
}
