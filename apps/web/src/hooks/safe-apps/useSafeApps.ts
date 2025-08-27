import { useMemo, useCallback } from 'react'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { useRemoteSafeApps } from '@/hooks/safe-apps/useRemoteSafeApps'
import { useCustomSafeApps } from '@/hooks/safe-apps/useCustomSafeApps'
import { usePinnedSafeApps } from '@/hooks/safe-apps/usePinnedSafeApps'
import { useBrowserPermissions, useSafePermissions } from './permissions'
import { useRankedSafeApps } from '@/hooks/safe-apps/useRankedSafeApps'
import { SAFE_APPS_EVENTS, type SAFE_APPS_LABELS, trackSafeAppEvent } from '@/services/analytics'
import { getOrigin } from '@/components/safe-apps/utils'
import { useSafeAppUrl } from './useSafeAppUrl'

type ReturnType = {
  allSafeApps: SafeAppData[]
  pinnedSafeApps: SafeAppData[]
  pinnedSafeAppIds: Set<number>
  remoteSafeApps: SafeAppData[]
  customSafeApps: SafeAppData[]
  rankedSafeApps: SafeAppData[]
  remoteSafeAppsLoading: boolean
  customSafeAppsLoading: boolean
  remoteSafeAppsError?: Error
  addCustomApp: (app: SafeAppData) => void
  togglePin: (appId: number, eventLabel: SAFE_APPS_LABELS) => void
  removeCustomApp: (appId: number) => void
  getSafeAppByUrl: (appUrl: string) => SafeAppData | undefined
  currentSafeApp: SafeAppData | undefined
}

const useSafeApps = (): ReturnType => {
  const [remoteSafeApps = [], remoteSafeAppsError, remoteSafeAppsLoading] = useRemoteSafeApps()
  const { customSafeApps, loading: customSafeAppsLoading, updateCustomSafeApps } = useCustomSafeApps()
  const { pinnedSafeAppIds, updatePinnedSafeApps } = usePinnedSafeApps()
  const { removePermissions: removeSafePermissions } = useSafePermissions()
  const { removePermissions: removeBrowserPermissions } = useBrowserPermissions()
  const appUrl = useSafeAppUrl()

  const allSafeApps = useMemo(
    () => remoteSafeApps.concat(customSafeApps).sort((a, b) => a.name.localeCompare(b.name)),
    [remoteSafeApps, customSafeApps],
  )

  const pinnedSafeApps = useMemo(
    () => remoteSafeApps.filter((app) => pinnedSafeAppIds.has(app.id)),
    [remoteSafeApps, pinnedSafeAppIds],
  )

  const rankedSafeApps = useRankedSafeApps(allSafeApps, pinnedSafeApps)

  const addCustomApp = useCallback(
    (app: SafeAppData) => {
      updateCustomSafeApps([...customSafeApps, app])
    },
    [updateCustomSafeApps, customSafeApps],
  )

  const removeCustomApp = useCallback(
    (appId: number) => {
      updateCustomSafeApps(customSafeApps.filter((app) => app.id !== appId))
      const app = customSafeApps.find((app) => app.id === appId)

      if (app) {
        removeSafePermissions(app.url)
        removeBrowserPermissions(app.url)
      }
    },
    [updateCustomSafeApps, customSafeApps, removeSafePermissions, removeBrowserPermissions],
  )

  const togglePin = (appId: number, eventLabel: SAFE_APPS_LABELS) => {
    const alreadyPinned = pinnedSafeAppIds.has(appId)
    const newSet = new Set(pinnedSafeAppIds)
    const appName = allSafeApps.find((app) => app.id === appId)?.name

    if (alreadyPinned) {
      newSet.delete(appId)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.UNPIN, label: eventLabel }, appName)
    } else {
      newSet.add(appId)
      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.PIN, label: eventLabel }, appName)
    }
    updatePinnedSafeApps(newSet)
  }

  const getSafeAppByUrl = useCallback(
    (appUrl: string) => {
      const appHostname = getOrigin(appUrl)
      return (
        allSafeApps.find((app) => app.url === appUrl) || allSafeApps.find((app) => getOrigin(app.url) === appHostname)
      )
    },
    [allSafeApps],
  )

  const currentSafeApp = useMemo(() => {
    return appUrl ? getSafeAppByUrl(appUrl) : undefined
  }, [getSafeAppByUrl, appUrl])

  return {
    allSafeApps,
    rankedSafeApps,

    remoteSafeApps,
    remoteSafeAppsLoading: remoteSafeAppsLoading || !(remoteSafeApps || remoteSafeAppsError),
    remoteSafeAppsError,

    pinnedSafeApps,
    pinnedSafeAppIds,
    togglePin,

    customSafeApps,
    customSafeAppsLoading,
    addCustomApp,
    removeCustomApp,

    getSafeAppByUrl,
    currentSafeApp,
  }
}

export { useSafeApps }
