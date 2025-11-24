import { useState, useEffect } from 'react'

export function useClock(interval = 1_000): number {
  const [timestamp, setTimestamp] = useState(Date.now())

  useEffect(() => {
    const timeout = setInterval(() => {
      setTimestamp((prev) => prev + interval)
    }, interval)

    return () => {
      clearInterval(timeout)
    }
  }, [interval])

  return timestamp
}
