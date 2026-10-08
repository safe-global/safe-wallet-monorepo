import { type SyntheticEvent, useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

import SafeAppCard from '@/components/safe-apps/SafeAppCard'
import AddCustomSafeAppCard from '@/components/safe-apps/AddCustomSafeAppCard'
import SafeAppPreviewDrawer from '@/components/safe-apps/SafeAppPreviewDrawer'
import SafeAppsZeroResultsPlaceholder from '@/components/safe-apps/SafeAppsZeroResultsPlaceholder'
import useSafeAppPreviewDrawer from '@/hooks/safe-apps/useSafeAppPreviewDrawer'
import { useOpenedSafeApps } from '@/hooks/safe-apps/useOpenedSafeApps'
import NativeSwapsCardCell from '@/components/safe-apps/NativeSwapsCard/NativeSwapsCardCell'
import { SAFE_APPS_EVENTS, SAFE_APPS_LABELS, trackSafeAppEvent, SafeAppLaunchLocation } from '@/services/analytics'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import { SafeAppListView } from '@views/components/safe-apps/SafeAppList/SafeAppListView'

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
    <SafeAppListView
      title={title}
      safeAppsList={safeAppsList}
      safeAppsListLoading={safeAppsListLoading}
      query={query}
      showAddCustomApp={!!addCustomApp}
      addCustomAppCard={addCustomApp && <AddCustomSafeAppCard safeAppList={safeAppsList} onSave={addCustomApp} />}
      showNativeSwapsCard={!isFiltered && showNativeSwapsCard}
      nativeSwapsCardCell={<NativeSwapsCardCell />}
      renderCard={(safeApp) => (
        <SafeAppCard
          safeApp={safeApp}
          isBookmarked={bookmarkedSafeAppsId?.has(safeApp.id)}
          onBookmarkSafeApp={() => togglePin(safeApp.id, eventLabel)}
          removeCustomApp={removeCustomApp}
          onClickSafeApp={(e) => handleSafeAppClick(e, safeApp)}
          openPreviewDrawer={openPreviewDrawer}
        />
      )}
      renderZeroResultsPlaceholder={(searchQuery) => <SafeAppsZeroResultsPlaceholder searchQuery={searchQuery} />}
      previewDrawer={
        <SafeAppPreviewDrawer
          isOpen={isPreviewDrawerOpen}
          safeApp={previewDrawerApp}
          isBookmarked={previewDrawerApp && bookmarkedSafeAppsId?.has(previewDrawerApp.id)}
          onClose={closePreviewDrawer}
          onBookmark={(appId) => togglePin(appId, SAFE_APPS_LABELS.apps_sidebar)}
        />
      }
    />
  )
}

export default SafeAppList
