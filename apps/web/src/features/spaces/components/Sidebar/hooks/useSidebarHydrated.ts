import { useEffect, useState } from 'react'

/**
 * Returns a hydration flag for sidebar rendering.
 *
 * It is `false` on SSR and on the initial client render, then becomes `true`
 * after mount. This allows rendering a stable fallback first and mounting
 * client-dependent sidebar content after hydration to avoid mismatches.
 */
export const useSidebarHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
