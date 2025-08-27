import { type SyntheticEvent, useCallback } from 'react'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'

import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import AddCustomSafeAppCard from '@/components/safe-apps/AddCustomSafeAppCard'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import SafeAppsListHeader from '@/components/safe-apps/SafeAppsListHeader'
import SafeAppsZeroResultsPlaceholder from '@/components/safe-apps/SafeAppsZeroResultsPlaceholder'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'
import css from './styles.module.css'
import { Skeleton } from '@mui/material'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import NativeSwapsCard from '@/components/safe-apps/NativeSwapsCard'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS, trackSafeAppEvent, SafeAppLaunchLocation } from '@/services/analytics'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'

type SafeAppListProps = {
  safeAppsList: SafeAppData[]
  safeAppsListLoading?: boolean
  bookmarkedSafeAppsId?: Set<number>
  eventLabel: SAFE_APPS_LABELS
  addCustomApp?: (safeApp: SafeAppData) => void
  removeCustomApp?: (safeApp: SafeAppData) => void
  title: string
  query?: string
  isFiltered?: boolean
  showNativeSwapsCard?: boolean
}

const SafeAppList = ({
  safeAppsList,
  safeAppsListLoading,
  bookmarkedSafeAppsId,
  eventLabel,
  addCustomApp,
  removeCustomApp,
  title,
  query,
  isFiltered = false,
  showNativeSwapsCard = false,
}: SafeAppListProps) => {
  const { togglePin } = useSafeApps()
  const { isPreviewDrawerOpen, previewDrawerApp, openPreviewDrawer, closePreviewDrawer } = useSafeAppPreviewDrawer()
  const { openedSafeAppIds } = useOpenedSafeApps()

  const showZeroResultsPlaceholder = query && safeAppsList.length === 0

  const handleSafeAppClick = useCallback(
    (e: SyntheticEvent, safeApp: SafeAppData) => {
      const isCustomApp = safeApp.id < 1
      if (!openedSafeAppIds.includes(safeApp.id) && !isCustomApp) {
        // Don't open link
        e.preventDefault()
        openPreviewDrawer(safeApp)
      } else {
        // We only track if not previously opened as it is then tracked in preview drawer
        trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: eventLabel }, safeApp, {
          launchLocation: SafeAppLaunchLocation.SAFE_APPS_LIST,
        })
      }
    },
    [eventLabel, openPreviewDrawer, openedSafeAppIds],
  )

  return (
    <>
      {/* Safe Apps List Header */}
      <SafeAppsListHeader title={title} amount={safeAppsList.length} />

      {/* Safe Apps List */}
      <ul data-testid="apps-list" className={css.safeAppsContainer}>
        {/* Add Custom Safe App Card */}
        {addCustomApp && (
          <li>
            <AddCustomSafeAppCard safeAppList={safeAppsList} onSave={addCustomApp} />
          </li>
        )}

        {safeAppsListLoading &&
          Array.from({ length: 8 }, (_, index) => (
            <li key={index}>
              <Skeleton variant="rounded" height="271px" />
            </li>
          ))}

        {!isFiltered && showNativeSwapsCard && <NativeSwapsCard />}

        {/* Flat list filtered by search query */}
        {safeAppsList.map((safeApp) => (
          <li key={safeApp.id}>
            <SafeAppCard
              safeApp={safeApp}
              isBookmarked={bookmarkedSafeAppsId?.has(safeApp.id)}
              onBookmarkSafeApp={() => togglePin(safeApp.id, eventLabel)}
              removeCustomApp={removeCustomApp}
              onClickSafeApp={(e) => handleSafeAppClick(e, safeApp)}
              openPreviewDrawer={openPreviewDrawer}
            />
          </li>
        ))}
      </ul>

      {/* Zero results placeholder */}
      {showZeroResultsPlaceholder && <SafeAppsZeroResultsPlaceholder searchQuery={query} />}

      {/* Safe App Preview Drawer */}
      <SafeAppPreviewDrawer
        isOpen={isPreviewDrawerOpen}
        safeApp={previewDrawerApp}
        isBookmarked={previewDrawerApp && bookmarkedSafeAppsId?.has(previewDrawerApp.id)}
        onClose={closePreviewDrawer}
        onBookmark={(appId) => togglePin(appId, SAFE_APPS_LABELS.apps_sidebar)}
      />
    </>
  )
}

export default SafeAppList
