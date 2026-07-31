import { useEffect, useState } from 'react'

/** `false` during the prerender and the first client render, `true` after mount. */
export const useIsHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
