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

const isAppUnavailable = (
  safeAppData: UseSafeAppRedirectsParams['safeAppData'],
  chainId: string,
  appUrl: string | undefined,
): boolean => {
  if (safeAppData) return !safeAppData.chainIds.includes(chainId)
  return Boolean(appUrl)
}

const shouldRedirectToShare = (appUrl: string | undefined, isReady: boolean, safe: unknown): boolean => {
  return Boolean(appUrl && isReady && !safe)
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

  useEffect(() => {
    if (!remoteSafeAppsLoading && isAppUnavailable(safeAppData, chainId, appUrl)) {
      goToList()
    }
  }, [safeAppData, chainId, goToList, remoteSafeAppsLoading, appUrl])

  if (shouldRedirectToShare(appUrl, router.isReady, router.query.safe)) {
    router.push({
      pathname: AppRoutes.share.safeApp,
      query: { appUrl },
    })
  }

  return Boolean(isSafeAppsEnabled && appUrl && router.isReady && router.query.safe)
}

export { useSafeAppRedirects }
