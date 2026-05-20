import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

const useFeatureFlagRedirect = () => {
  const router = useRouter()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isRequireLoginEnabled = useIsRequireLoginEnabled() ?? false

  useEffect(() => {
    // When the require-login gate is on, /welcome/spaces is the canonical
    // login page. Falling through to /welcome/accounts here would create a
    // ping-pong with the route guard, which then bounces /welcome/accounts
    // straight back to /welcome/spaces.
    if (isRequireLoginEnabled) return
    if (isSpacesFeatureEnabled === false) {
      router.push({ pathname: AppRoutes.welcome.accounts })
    }
  }, [isSpacesFeatureEnabled, isRequireLoginEnabled, router])
}

export default useFeatureFlagRedirect
