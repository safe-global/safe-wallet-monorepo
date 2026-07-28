import { useEffect, useState } from 'react'

/**
 * Returns `false` during the prerender and on the initial client render, then `true` after mount.
 *
 * The web app is a static export (`output: 'export'` in `next.config.mjs`), so the shipped HTML is
 * produced at build time with no URL, no `window` and no persisted state. React only requires that
 * the *first* client render match that HTML — a swap on a later render is an ordinary update. Use
 * this to render a stable fallback first and the client-dependent output after mount.
 */
export const useIsHydrated = (): boolean => {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}
