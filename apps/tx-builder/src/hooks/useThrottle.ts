import { useRef, useCallback } from 'react'

const DEFAULT_DELAY = 650

type ThrottleType = (callback: () => void, delay?: number) => void

const useThrottle: () => ThrottleType = () => {
  const timerRefId = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const throttle = useCallback<ThrottleType>((callback, delay = DEFAULT_DELAY) => {
    // If setTimeout is already scheduled, clearTimeout
    if (timerRefId.current) {
      clearTimeout(timerRefId.current)
    }

    // Schedule the exec after a delay
    timerRefId.current = setTimeout(function () {
      timerRefId.current = undefined
      return callback()
    }, delay)
  }, [])

  return throttle
}

export default useThrottle
