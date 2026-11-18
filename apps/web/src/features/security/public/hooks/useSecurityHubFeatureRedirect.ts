import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { withSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * Redirect away from the Security Hub page when `FEATURES.SECURITY_HUB` is disabled
 * on the current chain, landing the user back on the Space home.
 */
const useSecurityHubFeatureRedirect = () => {
  const router = useRouter()
  const isSecurityHubEnabled = useHasFeature(FEATURES.SECURITY_HUB)

  useEffect(() => {
    if (isSecurityHubEnabled === false) {
      router.push({ pathname: AppRoutes.spaces.index, query: withSpaceId({}, router.query.spaceId) })
    }
  }, [isSecurityHubEnabled, router])
}

export default useSecurityHubFeatureRedirect
