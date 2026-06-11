import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import type { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * Redirects away from a page when the given chain feature flag is explicitly
 * disabled. `undefined` (chain config still loading) does nothing, so pages
 * don't flicker through a redirect on first paint.
 */
const useFeatureRedirect = (feature: FEATURES, redirectRoute: string): void => {
  const router = useRouter()
  const isEnabled = useHasFeature(feature)

  useEffect(() => {
    if (isEnabled === false) {
      router.push({ pathname: redirectRoute })
    }
  }, [isEnabled, redirectRoute, router])
}

export default useFeatureRedirect
