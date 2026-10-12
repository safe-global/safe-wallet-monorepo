import { useEffect, useRef, useState } from 'react'

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1_000

export const isRateLimited = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 429

/** The shared CGW client never retries (WA-3252), and a 429 read as "no plan / no offers" would lock flows wrongly. */
export const useRateLimitRetry = ({ error, refetch }: { error: unknown; refetch: () => unknown }): boolean => {
  const attempts = useRef(0)
  const [isExhausted, setIsExhausted] = useState(false)

  useEffect(() => {
    if (!isRateLimited(error)) {
      attempts.current = 0
      setIsExhausted(false)
      return
    }
    if (attempts.current >= MAX_ATTEMPTS) {
      setIsExhausted(true)
      return
    }
    const id = setTimeout(
      () => {
        attempts.current += 1
        void refetch()
      },
      BASE_DELAY_MS * 2 ** attempts.current,
    )
    return () => clearTimeout(id)
  }, [error, refetch])

  // Derived in render: the effect runs a commit late, and a 429 read as an error in between skips flows for good.
  return isRateLimited(error) && !isExhausted
}
