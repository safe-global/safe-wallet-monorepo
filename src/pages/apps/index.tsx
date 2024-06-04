import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo } from 'react'
import debounce from 'lodash/debounce'

import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import SafeAppsSDKLink from '@/components/safe-apps/SafeAppsSDKLink'
import SafeAppsHeader from '@/components/safe-apps/SafeAppsHeader'
import SafeAppList from '@/components/safe-apps/SafeAppList'
import { AppRoutes } from '@/config/routes'
import useSafeAppsFilters from '@/hooks/safe-apps/useSafeAppsFilters'
import SafeAppsFilters from '@/components/safe-apps/SafeAppsFilters'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useNativeSwapsAppCard } from '@/components/safe-apps/hooks/useNativeSwapsAppCard'

const SafeApps: NextPage = () => {
  const router = useRouter()
  const { swapsCardDetails } = useNativeSwapsAppCard()
  const { remoteSafeApps, remoteSafeAppsLoading, pinnedSafeApps, pinnedSafeAppIds, togglePin } = useSafeApps()
  const allApps = useMemo(() => [swapsCardDetails, ...remoteSafeApps], [remoteSafeApps, swapsCardDetails])
  const { filteredApps, query, setQuery, setSelectedCategories, setOptimizedWithBatchFilter, selectedCategories } =
    useSafeAppsFilters(allApps)
  const isFiltered = filteredApps.length !== allApps.length
  const isSafeAppsEnabled = useHasFeature(FEATURES.SAFE_APPS)

  const nonPinnedApps = useMemo(
    () => allApps.filter((app) => !pinnedSafeAppIds.has(app.id)),
    [allApps, pinnedSafeAppIds],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChangeQuery = useCallback(debounce(setQuery, 300), [])

  // Redirect to an individual safe app page if the appUrl is in the query params
  useEffect(() => {
    const appUrl = router.query.appUrl as string
    if (appUrl) {
      router.push({ pathname: AppRoutes.apps.open, query: { safe: router.query.safe, appUrl } })
    }
  }, [router])

  if (!isSafeAppsEnabled) return <></>

  return (
    <>
      <Head>
        <title>{'Safe{Wallet} – Safe Apps'}</title>
      </Head>

      <SafeAppsSDKLink />

      <SafeAppsHeader />

      <main>
        {/* Safe Apps Filters */}
        <SafeAppsFilters
          onChangeQuery={onChangeQuery}
          onChangeFilterCategory={setSelectedCategories}
          onChangeOptimizedWithBatch={setOptimizedWithBatchFilter}
          selectedCategories={selectedCategories}
          safeAppsList={allApps}
        />

        {/* Pinned apps */}
        {!isFiltered && pinnedSafeApps.length > 0 && (
          <SafeAppList
            title="My pinned apps"
            safeAppsList={pinnedSafeApps}
            bookmarkedSafeAppsId={pinnedSafeAppIds}
            onBookmarkSafeApp={togglePin}
          />
        )}

        {/* All apps */}
        <SafeAppList
          title="All apps"
          safeAppsList={isFiltered ? filteredApps : nonPinnedApps}
          safeAppsListLoading={remoteSafeAppsLoading}
          bookmarkedSafeAppsId={pinnedSafeAppIds}
          onBookmarkSafeApp={togglePin}
          query={query}
        />
      </main>
    </>
  )
}

export default SafeApps
