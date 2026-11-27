import { useEffect, useState } from 'react'

/** Raises a limit by `step` every `delayMs` until it covers `total`, so N requests start a few at a time */
const useStaggeredLimit = (total: number, step: number, delayMs: number): number => {
  const [limit, setLimit] = useState(step)

  useEffect(() => {
    if (limit >= total) return
    const timer = setTimeout(() => setLimit((current) => current + step), delayMs)
    return () => clearTimeout(timer)
  }, [limit, total, step, delayMs])

  return limit
}

export default useStaggeredLimit
