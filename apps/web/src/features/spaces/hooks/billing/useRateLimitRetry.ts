import { useEffect, useRef, useState } from 'react'

const MAX_ATTEMPTS = 3
const BASE_DELAY_MS = 1_000

export const isRateLimited = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && (error as { status: unknown }).status === 429

/**
 * Re-runs a billing query a few times, with exponential backoff, when the CGW rate-limits it. The shared CGW client
 * deliberately never retries (WA-3252), and a 429 read as "no plan / no offers" would lock or skip flows wrongly.
 * Returns true while a retry is pending, so callers can keep reporting the query as loading.
 */
export const useRateLimitRetry = ({ error, refetch }: { error: unknown; refetch: () => unknown }): boolean => {
  const attempts = useRef(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (!isRateLimited(error)) {
      attempts.current = 0
      setIsRetrying(false)
      return
    }
    if (attempts.current >= MAX_ATTEMPTS) {
      setIsRetrying(false)
      return
    }
    setIsRetrying(true)
    const id = setTimeout(
      () => {
        attempts.current += 1
        void refetch()
      },
      BASE_DELAY_MS * 2 ** attempts.current,
    )
    return () => clearTimeout(id)
  }, [error, refetch])

  return isRetrying
}
