import type { MouseEvent, ReactElement } from 'react'
import type { AllowedFeatures } from '@/components/safe-apps/types'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import PermissionsCheckbox from '@/components/safe-apps/PermissionCheckbox'
import DeleteIcon from '@/public/images/common/delete.svg'
import SettingsCard from '@/components/settings/SettingsCard'

export type SafeAppPermissionItem = {
  domain: string
  appName?: string
  safePermissions?: Array<{ capability: string; label: string; checked: boolean }>
  browserPermissions?: Array<{ feature: AllowedFeatures; label: string; checked: boolean }>
}

export type SafeAppsPermissionsViewProps = {
  hasApps: boolean
  items: SafeAppPermissionItem[]
  onSafePermissionChange: (origin: string, capability: string, checked: boolean) => void
  onBrowserPermissionChange: (origin: string, feature: AllowedFeatures, checked: boolean) => void
  onAllowAll: (event: MouseEvent, origin: string) => void
  onClearAll: (event: MouseEvent, origin: string) => void
  onRemoveApp: (event: MouseEvent, origin: string) => void
}

export const SafeAppsPermissionsView = ({
  hasApps,
  items,
  onSafePermissionChange,
  onBrowserPermissionChange,
  onAllowAll,
  onClearAll,
  onRemoveApp,
}: SafeAppsPermissionsViewProps): ReactElement => {
  if (!hasApps) {
    return <div />
  }

  return (
    <SettingsCard title="Safe Apps permissions">
      {!items.length && (
        <Typography className="text-muted-foreground">There are no Safe Apps using permissions.</Typography>
      )}
      {items.map(({ domain, appName, safePermissions, browserPermissions }) => (
        <div
          key={domain}
          data-testid="app-permissions-item"
          className="mb-4 rounded-lg border border-[var(--color-border-light)]"
        >
          <div className="grid grid-cols-1 border-b border-[var(--color-border-light)] px-6 py-4 sm:grid-cols-12">
            <div className="py-2 sm:col-span-5">
              <Typography variant="paragraph-bold" as="h5">
                {appName}
              </Typography>
              <Typography variant="paragraph-small">{domain}</Typography>
            </div>
            <div className="grid grid-cols-1 gap-x-4 py-2 sm:col-span-7 sm:grid-cols-2 2xl:grid-cols-3">
              {safePermissions?.map(({ capability, label, checked }) => {
                return (
                  <div key={capability}>
                    <PermissionsCheckbox
                      name={capability}
                      label={label}
                      onChange={(_, checked: boolean) => onSafePermissionChange(domain, capability, checked)}
                      checked={checked}
                    />
                  </div>
                )
              })}
              {browserPermissions?.map(({ feature, label, checked }) => {
                return (
                  <div key={feature}>
                    <PermissionsCheckbox
                      name={feature.toString()}
                      label={label}
                      onChange={(_, checked: boolean) => onBrowserPermissionChange(domain, feature, checked)}
                      checked={checked}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-4 px-6 py-3">
            <Link href="#" className="no-underline hover:no-underline" onClick={(event) => onAllowAll(event, domain)}>
              Allow all
            </Link>
            <Link
              href="#"
              className="text-destructive no-underline hover:no-underline"
              onClick={(event) => onClearAll(event, domain)}
            >
              Clear all
            </Link>
            <Link
              href="#"
              className="flex items-center text-destructive"
              onClick={(event) => onRemoveApp(event, domain)}
            >
              <DeleteIcon className="size-4" />
            </Link>
          </div>
        </div>
      ))}
    </SettingsCard>
  )
}
