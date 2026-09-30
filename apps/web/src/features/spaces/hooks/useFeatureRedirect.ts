import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import type { FEATURES } from '@safe-global/utils/utils/chains'

/** Redirects when `isOn` is explicitly `false`; `undefined` (chain config loading) waits, so pages don't flicker. */
export const useRedirectWhenOff = (isOn: boolean | undefined, redirectRoute: string): void => {
  const router = useRouter()

  useEffect(() => {
    if (isOn === false) {
      // Keep the workspace context — without spaceId the spaces index bounces
      // the user out to /welcome/spaces.
      const spaceId = router.query.spaceId
      router.push({ pathname: redirectRoute, query: spaceId ? { spaceId } : undefined })
    }
  }, [isOn, redirectRoute, router])
}

/** Redirects away from a page when the given chain feature flag is explicitly disabled. */
const useFeatureRedirect = (feature: FEATURES, redirectRoute: string): void => {
  useRedirectWhenOff(useHasFeature(feature), redirectRoute)
}

export default useFeatureRedirect
