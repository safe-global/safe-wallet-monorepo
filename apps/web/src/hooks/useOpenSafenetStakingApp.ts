import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { SafeAppsTag } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { useLazySafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { getSpaceIdSearchParam, useUrlSpaceId } from '@/hooks/useUrlSpaceId'

/**
 * Navigates to the native SAFE (Safenet) staking app.
 *
 * Resolves the Safe App tagged as `SAFENET` for the current chain and opens it in the
 * embedded app frame. Shared by the top bar Safe token button and the staking promo banner
 * so both point to the same destination.
 */
export const useOpenSafenetStakingApp = () => {
  const query = useSearchParams()
  const spaceId = useUrlSpaceId()
  const chainId = useChainId()
  const router = useRouter()
  const [triggerSafeApps] = useLazySafeAppsGetSafeAppsV1Query()
  const [isNavigating, setIsNavigating] = useState(false)
  const isNavigatingRef = useRef(false)

  const openSafenetStakingApp = async () => {
    if (isNavigatingRef.current) return
    isNavigatingRef.current = true
    setIsNavigating(true)
    try {
      const [apps] = await Promise.all([
        triggerSafeApps({ chainId, clientUrl: window.location.origin }).unwrap(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
      const safenetApp = apps.find((app) => app.tags.includes(SafeAppsTag.SAFENET))
      if (!safenetApp) return
      router.push(
        `${AppRoutes.apps.open}?safe=${query?.get('safe')}${getSpaceIdSearchParam(spaceId)}&appUrl=${encodeURIComponent(safenetApp.url)}`,
      )
    } catch (error) {
      logError(ErrorCodes._902, error)
    } finally {
      setIsNavigating(false)
      isNavigatingRef.current = false
    }
  }

  return { openSafenetStakingApp, isNavigating }
}
