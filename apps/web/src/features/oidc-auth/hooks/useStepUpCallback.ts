import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import reconcileAuth from '@/store/reconcileAuth'
import { STEP_UP_CANCELLED, STEP_UP_FAILED_MESSAGE } from '../constants'
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
    dispatch(stepUpReturning())

    const processCallback = async (): Promise<boolean> => {
      // `router.query` can still be empty before `router.isReady` on first render.
      const params = new URLSearchParams(window.location.search)

      if (params.has('error')) {
        // Cancelling the challenge is the user's choice and gets no message. Anything
        // else here is the provider or the gateway failing, which does.
        const cancelled =
          params.get('error') === STEP_UP_CANCELLED.error &&
          params.get('error_description') === STEP_UP_CANCELLED.description
        if (!cancelled) {
          dispatch(showNotification({ message: STEP_UP_FAILED_MESSAGE, variant: 'error', groupKey: 'step-up-failed' }))
        }

        params.delete('error')
        params.delete('error_description')
        const cleanQuery = Object.fromEntries(params.entries())
        routerRef.current.replace({ pathname: routerRef.current.pathname, query: cleanQuery }, undefined, {
          shallow: true,
        })
        return false
      }

      await reconcileAuth(dispatch)
      return trip.action ? replayStepUpAction(dispatch, trip.action) : false
    }

    void processCallback()
      .catch(() => false)
      .then((isLeavingPage) => {
        // A replay that sends the browser on (the Stripe checkout) keeps the splash up, so the
        // page it is leaving does not show for an instant before the next one loads.
        if (!isLeavingPage) dispatch(stepUpSettled())
      })
  }, [dispatch])

  // Coming back from the challenge with the Back button restores this page from the
  // back-forward cache, so the effect above does not run: the trip stays stored, and
  // a later page load would replay an action the user walked away from; the phase
  // stays `leaving`, and the launch screen would stay up until its timer runs out.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return

      takeStepUpTrip()
      dispatch(stepUpSettled())
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [dispatch])
}
