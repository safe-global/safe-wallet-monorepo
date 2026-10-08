import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import {
  getBrowserPermissionDisplayValues,
  getSafePermissionDisplayValues,
  useBrowserPermissions,
  useSafePermissions,
} from '@/hooks/safe-apps/permissions'
import type { ReactElement } from 'react'
import { useCallback, useMemo } from 'react'
import type { AllowedFeatures } from '@/components/safe-apps/types'
import { PermissionStatus } from '@/components/safe-apps/types'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { SafeAppsPermissionsView } from '@views/components/settings/SafeAppsPermissions/SafeAppsPermissionsView'

const SafeAppsPermissions = (): ReactElement => {
  const { allSafeApps } = useSafeApps()
  const {
    permissions: safePermissions,
    updatePermission: updateSafePermission,
    removePermissions: removeSafePermissions,
    isUserRestricted,
  } = useSafePermissions()
  const {
    permissions: browserPermissions,
    updatePermission: updateBrowserPermission,
    removePermissions: removeBrowserPermissions,
  } = useBrowserPermissions()
  const domains = useMemo(() => {
    const mergedPermissionsSet = new Set(Object.keys(browserPermissions).concat(Object.keys(safePermissions)))

    return Array.from(mergedPermissionsSet)
  }, [safePermissions, browserPermissions])

  const handleSafePermissionsChange = (origin: string, capability: string, checked: boolean) =>
    updateSafePermission(origin, [{ capability, selected: checked }])

  const handleBrowserPermissionsChange = (origin: string, feature: AllowedFeatures, checked: boolean) =>
    updateBrowserPermission(origin, [{ feature, selected: checked }])

  const updateAllPermissions = useCallback(
    (origin: string, selected: boolean) => {
      if (safePermissions[origin]?.length)
        updateSafePermission(
          origin,
          safePermissions[origin].map(({ parentCapability }) => ({ capability: parentCapability, selected })),
        )

      if (browserPermissions[origin]?.length)
        updateBrowserPermission(
          origin,
          browserPermissions[origin].map(({ feature }) => ({ feature, selected })),
        )
    },
    [browserPermissions, safePermissions, updateBrowserPermission, updateSafePermission],
  )

  const handleAllowAll = useCallback(
    (event: React.MouseEvent, origin: string) => {
      event.preventDefault()
      updateAllPermissions(origin, true)
    },
    [updateAllPermissions],
  )

  const handleClearAll = useCallback(
    (event: React.MouseEvent, origin: string) => {
      event.preventDefault()
      updateAllPermissions(origin, false)
    },
    [updateAllPermissions],
  )

  const handleRemoveApp = useCallback(
    (event: React.MouseEvent, origin: string) => {
      event.preventDefault()
      removeSafePermissions(origin)
      removeBrowserPermissions(origin)
    },
    [removeBrowserPermissions, removeSafePermissions],
  )

  const appNames = useMemo(() => {
    const appNames = allSafeApps.reduce((acc: Record<string, string>, app: SafeAppData) => {
      acc[app.url] = app.name
      return acc
    }, {})

    return appNames
  }, [allSafeApps])

  const items = domains.map((domain) => ({
    domain,
    appName: appNames[domain],
    safePermissions: safePermissions[domain]?.map(({ parentCapability, caveats }) => ({
      capability: parentCapability,
      label: getSafePermissionDisplayValues(parentCapability).displayName,
      checked: !isUserRestricted(caveats),
    })),
    browserPermissions: browserPermissions[domain]?.map(({ feature, status }) => ({
      feature,
      label: getBrowserPermissionDisplayValues(feature).displayName,
      checked: status === PermissionStatus.GRANTED ? true : false,
    })),
  }))

  return (
    <SafeAppsPermissionsView
      hasApps={!!allSafeApps.length}
      items={items}
      onSafePermissionChange={handleSafePermissionsChange}
      onBrowserPermissionChange={handleBrowserPermissionsChange}
      onAllowAll={handleAllowAll}
      onClearAll={handleClearAll}
      onRemoveApp={handleRemoveApp}
    />
  )
}

export default SafeAppsPermissions
