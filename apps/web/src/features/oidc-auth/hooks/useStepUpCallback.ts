import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import reconcileAuth from '@/store/reconcileAuth'
import { STEP_UP_FAILED_MESSAGE } from '../constants'
import { stepUpReturning, stepUpSettled } from '../store'
import { replayStepUpAction, takeStepUpTrip } from '../utils/stepUpReplay'

/** Call once globally, from `InitApp`, so it runs on page load. */
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
    // Held until the refetches finish. Otherwise the lists still show the old
    // data next to a success message, then jump once the refetch arrives.
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

    // Settled even if this throws. Left in `returning`, the phase would block
    // every later verification in this tab and keep the splash screen up.
    void processCallback()
      .finally(() => dispatch(stepUpSettled()))
      .catch(() => undefined)
  }, [dispatch])
}
