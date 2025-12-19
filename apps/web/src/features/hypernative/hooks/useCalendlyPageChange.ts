import { useCallback, useEffect, useState } from 'react'

/**
 * Hook to detect when Calendly moves to the 2nd step (date/time selection).
 * Returns true when the user has progressed past the initial region/event selection.
 *
 * @returns boolean indicating if user is on 2nd step or later
 */
export const useCalendlyPageChange = (): boolean => {
  const [isSecondStep, setIsSecondStep] = useState(false)

  const isValidOrigin = useCallback((origin: string): boolean => {
    try {
      const url = new URL(origin)
      const allowedHosts = ['calendly.com', 'www.calendly.com']
      return url.protocol === 'https:' && allowedHosts.includes(url.hostname)
    } catch {
      return false
    }
  }, [])

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) {
        return
      }

      if (event.data?.event === 'calendly.event_type_viewed') {
        setIsSecondStep(true)
      }
    },
    [isValidOrigin],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  return isSecondStep
}
