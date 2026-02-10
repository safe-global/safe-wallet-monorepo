import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'

type UseSafeAppRedirectsParams = {
  safeAppData: { chainIds: string[] } | undefined
  chainId: string
  isSafeAppsEnabled: boolean | undefined
  appUrl: string | undefined
  remoteSafeAppsLoading: boolean
  goToList: () => void
}

const useSafeAppRedirects = ({
  safeAppData,
  chainId,
  isSafeAppsEnabled,
  appUrl,
  remoteSafeAppsLoading,
  goToList,
}: UseSafeAppRedirectsParams): boolean => {
  const router = useRouter()

  // Redirect to the apps list if the current chain is not supported
  useEffect(() => {
    if (remoteSafeAppsLoading) return

    const isUnsupportedChain = safeAppData && !safeAppData.chainIds.includes(chainId)
    const isAppNotFound = !safeAppData && appUrl

    if (isUnsupportedChain || isAppNotFound) {
      goToList()
    }
  }, [safeAppData, chainId, goToList, remoteSafeAppsLoading, appUrl])

  const canRender = Boolean(isSafeAppsEnabled && appUrl && router.isReady && router.query.safe)

  // No `safe` query param, redirect to the share route
  if (appUrl && router.isReady && !router.query.safe) {
    router.push({
      pathname: AppRoutes.share.safeApp,
      query: { appUrl },
    })
  }

  return canRender
}

export { useSafeAppRedirects }
