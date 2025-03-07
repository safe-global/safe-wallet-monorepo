import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

import { useSafeAppUrl } from '@/hooks/safe-apps/useSafeAppUrl'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import SafeAppsInfoModal from '@/components/safe-apps/SafeAppsInfoModal'
import useSafeAppsInfoModal from '@/components/safe-apps/SafeAppsInfoModal/useSafeAppsInfoModal'
import SafeAppsErrorBoundary from '@/components/safe-apps/SafeAppsErrorBoundary'
import SafeAppsLoadError from '@/components/safe-apps/SafeAppsErrorBoundary/SafeAppsLoadError'
import AppFrame from '@/components/safe-apps/AppFrame'
import { useSafeAppFromManifest } from '@/hooks/safe-apps/useSafeAppFromManifest'
import { useBrowserPermissions } from '@/hooks/safe-apps/permissions'
import useChainId from '@/hooks/useChainId'
import { AppRoutes } from '@/config/routes'
import { getOrigin } from '@/components/safe-apps/utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'

const SafeApps: NextPage = () => {
  const chainId = useChainId()
  const router = useRouter()
  const appUrl = useSafeAppUrl()
  const { allSafeApps, remoteSafeAppsLoading } = useSafeApps()
  const safeAppData = allSafeApps.find((app) => app.url === appUrl)
  const { safeApp, isLoading } = useSafeAppFromManifest(appUrl || '', chainId, safeAppData)
  const isSafeAppsEnabled = useHasFeature(FEATURES.SAFE_APPS)
  const currentChain = useCurrentChain()

  const { addPermissions, getPermissions, getAllowedFeaturesList } = useBrowserPermissions()
  const origin = getOrigin(appUrl)
  const {
    isModalVisible,
    isSafeAppInDefaultList,
    isFirstTimeAccessingApp,
    isConsentAccepted,
    isPermissionsReviewCompleted,
    onComplete,
  } = useSafeAppsInfoModal({
    url: origin,
    safeApp: safeAppData,
    permissions: safeApp?.safeAppsPermissions || [],
    addPermissions,
    getPermissions,
    remoteSafeAppsLoading,
  })

  const goToList = useCallback(() => {
    router.push({
      pathname: AppRoutes.apps.index,
      query: { safe: router.query.safe },
    })
  }, [router])

  useEffect(() => {
    if (!remoteSafeAppsLoading && !isLoading && safeApp.chainIds.length === 0) {
      const timer = setTimeout(() => {
        router.push({
          pathname: AppRoutes.apps.index,
          query: { safe: router.query.safe },
        })
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [remoteSafeAppsLoading, isLoading, safeApp.chainIds.length, router, router.query.safe])

  // appUrl is required to be present
  if (!isSafeAppsEnabled || !appUrl || !router.isReady) return null

  // No `safe` query param, redirect to the share route
  if (router.isReady && !router.query.safe) {
    router.push({
      pathname: AppRoutes.share.safeApp,
      query: { appUrl },
    })
    return null
  }

  if (isModalVisible) {
    return (
      <SafeAppsInfoModal
        key={isLoading ? 'loading' : 'loaded'}
        onCancel={goToList}
        onConfirm={onComplete}
        features={safeApp.safeAppsPermissions}
        appUrl={safeApp.url}
        isConsentAccepted={isConsentAccepted}
        isPermissionsReviewCompleted={isPermissionsReviewCompleted}
        isSafeAppInDefaultList={isSafeAppInDefaultList}
        isFirstTimeAccessingApp={isFirstTimeAccessingApp}
      />
    )
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    )
  }

  if (!remoteSafeAppsLoading && !isLoading && safeApp.chainIds.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100%"
        textAlign="center"
        p={2}
      >
        <Typography variant="body1" gutterBottom>
          {currentChain?.chainName} is not supported in this app. <br />
          Redirecting to home page
        </Typography>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <SafeAppsErrorBoundary render={() => <SafeAppsLoadError onBackToApps={() => router.back()} />}>
      <AppFrame appUrl={appUrl} allowedFeaturesList={getAllowedFeaturesList(origin)} safeAppFromManifest={safeApp} />
    </SafeAppsErrorBoundary>
  )
}

export default SafeApps
