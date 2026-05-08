import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import useChains from '@/hooks/useChains'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { hasFeature, FEATURES } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'

/**
 * `true` once the chains query has settled at least one real network fetch
 * since mount. The store preloads the query with a build-time snapshot
 * (`apps/web/src/config/__generated__/chains.json`), so without this guard
 * we'd act on stale data when CGW has rolled out a feature that isn't yet
 * baked into the snapshot.
 */
const useChainsAreLive = (): boolean => {
  const { isFetching } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY, {
    refetchOnMountOrArgChange: true,
  })
  const sawFetch = useRef(false)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (isFetching) sawFetch.current = true
    else if (sawFetch.current) setIsLive(true)
  }, [isFetching])

  return isLive
}

/**
 * Redirect away from the Security Hub when `FEATURES.SECURITY_HUB` is disabled
 * across every chain. Spaces are cross-chain, so we check all configured
 * chains rather than the "current" one (which has no meaning on Spaces routes).
 */
const useSecurityHubFeatureRedirect = () => {
  const router = useRouter()
  const { configs } = useChains()
  const chainsAreLive = useChainsAreLive()

  useEffect(() => {
    if (!chainsAreLive) return
    const enabled = configs.some((chain) => hasFeature(chain, FEATURES.SECURITY_HUB))
    if (!enabled) router.push({ pathname: AppRoutes.spaces.index })
  }, [chainsAreLive, configs, router])
}

export default useSecurityHubFeatureRedirect
