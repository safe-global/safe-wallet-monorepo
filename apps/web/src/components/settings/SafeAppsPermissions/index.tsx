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
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import PermissionsCheckbox from '@/components/safe-apps/PermissionCheckbox'
import DeleteIcon from '@/public/images/common/delete.svg'
import SettingsCard from '@/components/settings/SettingsCard'

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

  if (!allSafeApps.length) {
    return <div />
  }

  return (
    <SettingsCard title="Safe Apps permissions">
      {!domains.length && (
        <Typography className="text-muted-foreground">There are no Safe Apps using permissions.</Typography>
      )}
      {domains.map((domain) => (
        <div key={domain} className="mb-4 rounded-lg border border-[var(--color-border-light)]">
          <div className="grid grid-cols-1 border-b border-[var(--color-border-light)] px-6 py-[15px] sm:grid-cols-12">
            <div className="py-[9px] sm:col-span-5">
              <Typography variant="paragraph-bold">{appNames[domain]}</Typography>
              <Typography variant="paragraph-small">{domain}</Typography>
            </div>
            <div className="grid grid-cols-1 sm:col-span-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {safePermissions[domain]?.map(({ parentCapability, caveats }) => {
                return (
                  <div key={parentCapability}>
                    <PermissionsCheckbox
                      name={parentCapability}
                      label={getSafePermissionDisplayValues(parentCapability).displayName}
                      onChange={(_, checked: boolean) => handleSafePermissionsChange(domain, parentCapability, checked)}
                      checked={!isUserRestricted(caveats)}
                    />
                  </div>
                )
              })}
              {browserPermissions[domain]?.map(({ feature, status }) => {
                return (
                  <div key={feature}>
                    <PermissionsCheckbox
                      name={feature.toString()}
                      label={getBrowserPermissionDisplayValues(feature).displayName}
                      onChange={(_, checked: boolean) => handleBrowserPermissionsChange(domain, feature, checked)}
                      checked={status === PermissionStatus.GRANTED ? true : false}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-4 px-6 py-3">
            <Link
              href="#"
              className="no-underline hover:no-underline"
              onClick={(event) => handleAllowAll(event, domain)}
            >
              Allow all
            </Link>
            <Link
              href="#"
              className="text-destructive no-underline hover:no-underline"
              onClick={(event) => handleClearAll(event, domain)}
            >
              Clear all
            </Link>
            <Link href="#" className="text-destructive" onClick={(event) => handleRemoveApp(event, domain)}>
              <DeleteIcon className="size-4" />
            </Link>
          </div>
        </div>
      ))}
    </SettingsCard>
  )
}

export default SafeAppsPermissions
