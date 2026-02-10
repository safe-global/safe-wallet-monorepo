import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

type UseSafeAppRedirectsParams = {
  safeAppData: { chainIds: string[] } | undefined
  chainId: string
  isSafeAppsEnabled: boolean | undefined
  appUrl: string | undefined
  goToList: () => void
}

const useSafeAppRedirects = ({
  safeAppData,
  chainId,
  isSafeAppsEnabled,
  appUrl,
  goToList,
}: UseSafeAppRedirectsParams): boolean => {
  const router = useRouter()

  // Redirect to the apps list if the current chain is not supported
  useEffect(() => {
    if (safeAppData && !safeAppData.chainIds.includes(chainId)) {
      goToList()
    }
  }, [safeAppData, chainId, goToList])

  if (!isSafeAppsEnabled || !appUrl || !router.isReady) return false

  // No `safe` query param, redirect to the share route
  if (!router.query.safe) {
    router.push({
      pathname: AppRoutes.share.safeApp,
      query: { appUrl },
    })
    return false
  }

  return true
}

export { useSafeAppRedirects }
