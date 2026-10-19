import type { AllowedFeatures } from '@safe-global/views/components/safe-apps/types'
import { PermissionStatus } from '@safe-global/views/components/safe-apps/types'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCallback } from 'react'
import { trimTrailingSlash } from '@/utils/url'

const BROWSER_PERMISSIONS = 'SafeApps__browserPermissions'

export type BrowserPermission = { feature: AllowedFeatures; status: PermissionStatus }

type BrowserPermissions = { [origin: string]: BrowserPermission[] }

type BrowserPermissionChangeSet = { feature: AllowedFeatures; selected: boolean }[]

type UseBrowserPermissionsReturnType = {
  permissions: BrowserPermissions
  getPermissions: (origin: string) => BrowserPermission[]
  updatePermission: (origin: string, changeset: BrowserPermissionChangeSet) => void
  addPermissions: (origin: string, permissions: BrowserPermission[]) => void
  removePermissions: (origin: string) => void
  getAllowedFeaturesList: (origin: string) => string
}

const useBrowserPermissions = (): UseBrowserPermissionsReturnType => {
  const [permissions = {}, setPermissions] = useLocalStorage<BrowserPermissions>(BROWSER_PERMISSIONS)

  const getPermissions = useCallback(
    (origin: string) => {
      return permissions[trimTrailingSlash(origin)] || []
    },
    [permissions],
  )

  const updatePermission = useCallback(
    (origin: string, changeset: BrowserPermissionChangeSet) => {
      const appUrl = trimTrailingSlash(origin)

      setPermissions({
        ...permissions,
        [appUrl]: permissions[appUrl].map((p) => {
          const change = changeset.find((change) => change.feature === p.feature)

          if (change) {
            p.status = change.selected ? PermissionStatus.GRANTED : PermissionStatus.DENIED
          }

          return p
        }),
      })
    },
    [permissions, setPermissions],
  )

  const removePermissions = useCallback(
    (origin: string) => {
      delete permissions[trimTrailingSlash(origin)]
      setPermissions({ ...permissions })
    },
    [permissions, setPermissions],
  )

  const addPermissions = useCallback(
    (origin: string, selectedPermissions: BrowserPermission[]) => {
      setPermissions({ ...permissions, [trimTrailingSlash(origin)]: selectedPermissions })
    },
    [permissions, setPermissions],
  )

  const getAllowedFeaturesList = useCallback(
    (origin: string): string => {
      return getPermissions(origin)
        .filter(({ status }) => status === PermissionStatus.GRANTED)
        .map((permission) => permission.feature)
        .join('; ')
    },
    [getPermissions],
  )

  return {
    permissions,
    getPermissions,
    updatePermission,
    addPermissions,
    removePermissions,
    getAllowedFeaturesList,
  }
}

export { useBrowserPermissions }
