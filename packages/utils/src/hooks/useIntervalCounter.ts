import { useCallback, useEffect, useState } from 'react'

export const useIntervalCounter = (interval: number): [number, () => void] => {
  const [counter, setCounter] = useState<number>(0)

  const resetCounter = useCallback(() => {
    setCounter(0)
  }, [setCounter])

  useEffect(() => {
    let reqFrameId: number
    const timerId = setTimeout(() => {
      // requestAnimationFrame prevents the timer from ticking in a background tab
      reqFrameId = requestAnimationFrame(() => {
        setCounter(counter + 1)
      })
    }, interval)
    return () => {
      clearTimeout(timerId)
      if (reqFrameId) {
        cancelAnimationFrame(reqFrameId)
      }
    }
  }, [counter, interval])

  return [counter, resetCounter]
}
