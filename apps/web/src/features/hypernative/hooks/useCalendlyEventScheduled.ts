import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook to listen for Calendly event_scheduled events via postMessage.
 * Calls the callback when a booking is successfully scheduled.
 *
 * @param onBookingScheduled - Callback function to call when a booking is scheduled
 */
export const useCalendlyEventScheduled = (onBookingScheduled?: () => void): void => {
  const hasScheduledRef = useRef(false)

  const isValidOrigin = useCallback((origin: string): boolean => {
    return origin.startsWith('https://calendly.com') || origin.startsWith('https://www.calendly.com')
  }, [])

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) {
        return
      }

      if (event.data?.event === 'calendly.event_scheduled') {
        // Only call callback once per booking
        if (!hasScheduledRef.current && onBookingScheduled) {
          hasScheduledRef.current = true
          onBookingScheduled()
        }
      }
    },
    [isValidOrigin, onBookingScheduled],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])
}
