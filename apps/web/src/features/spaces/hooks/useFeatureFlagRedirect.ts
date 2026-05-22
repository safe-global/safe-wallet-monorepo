import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'

const useFeatureFlagRedirect = () => {
  const router = useRouter()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isRequireLoginEnabled = useIsRequireLoginEnabled()

  useEffect(() => {
    // Wait until the gate flag has resolved so we don't briefly fall through
    // to /welcome/accounts (and ping-pong with the route guard) before the
    // chains config has loaded.
    if (isRequireLoginEnabled !== false) return
    if (isSpacesFeatureEnabled === false) {
      router.push({ pathname: AppRoutes.welcome.accounts })
    }
  }, [isSpacesFeatureEnabled, isRequireLoginEnabled, router])
}

export default useFeatureFlagRedirect
