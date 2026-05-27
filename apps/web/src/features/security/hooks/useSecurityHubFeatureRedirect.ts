import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'

/**
 * Redirect away from the Security Hub page when `FEATURES.SECURITY_HUB` is disabled
 * on the current chain. The broader Spaces UI may still be enabled — in that case
 * we land the user back on the Space home rather than ejecting to welcome.
 *
 * Mirrors `apps/web/src/features/spaces/hooks/useFeatureFlagRedirect.ts`.
 */
const useSecurityHubFeatureRedirect = () => {
  const router = useRouter()
  const isSecurityHubEnabled = useHasFeature(FEATURES.SECURITY_HUB)

  useEffect(() => {
    if (isSecurityHubEnabled === false) {
      router.push({ pathname: AppRoutes.spaces.index })
    }
  }, [isSecurityHubEnabled, router])
}

export default useSecurityHubFeatureRedirect
