import { useEffect, useState } from 'react'

// Reads Date.now() on every tick so a throttled background tab can't fall behind the chain's clock.
export const useNow = (interval = 1_000): number => {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])

  return now
}
