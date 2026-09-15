import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import reconcileAuth from '@/store/reconcileAuth'
import { stepUpReturning, stepUpSettled } from '../store'
import { hasPendingStepUpTrip, replayStepUpAction, takeStepUpTrip } from '../utils/stepUpReplay'

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

    const processCallback = async () => {
      // `router.query` can still be empty before `router.isReady` on first render.
      const params = new URLSearchParams(window.location.search)

      if (params.has('error')) {
        // Leaving the challenge unfinished cancels the action; the page returns to
        // how it was and says nothing.
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

    void processCallback()
      .finally(() => dispatch(stepUpSettled()))
      .catch(() => undefined)
  }, [dispatch])

  // Coming back from the challenge with the Back button restores this page from the
  // back-forward cache, so no effect above runs and the call site that was rejected
  // still holds the error it set before leaving. Reloading drops that state and puts
  // the return on the same path every other browser takes.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || !hasPendingStepUpTrip()) return

      window.location.reload()
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])
}
