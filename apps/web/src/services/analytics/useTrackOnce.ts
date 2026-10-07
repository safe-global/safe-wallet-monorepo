import { useEffect, useRef } from 'react'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from './types'

/** Sends the event once, when `ready` first becomes true, with the params of that render. */
export const useTrackOnce = (event: AnalyticsEvent, params?: Record<string, unknown>, ready = true) => {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (!ready || hasTracked.current) return
    hasTracked.current = true
    trackEvent(event, params)
  }, [ready]) // eslint-disable-line react-hooks/exhaustive-deps -- once, with the values of that moment
}
