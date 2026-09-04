import { useMemo } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { getNativeRouteForSafeApp } from '@/services/safe-apps/nativeRoutes'

/**
 * Returns the native route (e.g. `/swap`, `/bridge`) that should replace the given Safe App
 * on the current chain, or `undefined` when the app should be opened as-is.
 */
const useNativeSafeAppRoute = (appUrl: string | undefined): string | undefined => {
  const chain = useCurrentChain()

  return useMemo(() => getNativeRouteForSafeApp(appUrl, chain), [appUrl, chain])
}

export { useNativeSafeAppRoute }
