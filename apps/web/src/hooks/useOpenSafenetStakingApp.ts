import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppRoutes } from '@/config/routes'
import { SafeAppsTag } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import { useLazySafeAppsGetSafeAppsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

/**
 * Navigates to the native SAFE (Safenet) staking app.
 *
 * Resolves the Safe App tagged as `SAFENET` for the current chain and opens it in the
 * embedded app frame. Shared by the top bar Safe token button and the staking promo banner
 * so both point to the same destination.
 */
export const useOpenSafenetStakingApp = () => {
  const query = useSearchParams()
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
        triggerSafeApps({ chainId, clientUrl: window.location.origin }),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ])
      const safenetApp = apps.data?.find((app) => app.tags.includes(SafeAppsTag.SAFENET))
      if (!safenetApp) return
      router.push(`${AppRoutes.apps.open}?safe=${query?.get('safe')}&appUrl=${encodeURIComponent(safenetApp.url)}`)
    } finally {
      setIsNavigating(false)
      isNavigatingRef.current = false
    }
  }

  return { openSafenetStakingApp, isNavigating }
}
