import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useAppDispatch } from '@/store'
import reconcileAuth from '@/store/reconcileAuth'
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

    const processCallback = async () => {
      // `router.query` can still be empty before `router.isReady` on first render.
      const params = new URLSearchParams(window.location.search)

      // An abandoned verification is not reported: the user left the
      // verification screen themselves and already knows it did not finish.
      if (params.has('error')) {
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
}
