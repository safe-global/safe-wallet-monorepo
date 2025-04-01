import { useEffect } from 'react'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'

const useFeatureFlagRedirect = () => {
  const router = useRouter()
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)

  useEffect(() => {
    if (isSpacesFeatureEnabled === false) {
      router.push({ pathname: AppRoutes.welcome.accounts })
    }
  }, [isSpacesFeatureEnabled, router])
}

export default useFeatureFlagRedirect
