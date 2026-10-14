import { useState, useCallback } from 'react'
import type { Methods } from '@safe-global/safe-apps-sdk'
import type {
  Permission,
  PermissionCaveat,
  PermissionRequest,
} from '@safe-global/safe-apps-sdk/dist/types/types/permissions'

import { PermissionStatus } from '@safe-global/views/components/safe-apps/types'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { trimTrailingSlash } from '@/utils/url'

const SAFE_PERMISSIONS = 'SafeApps__safePermissions'
const USER_RESTRICTED = 'userRestricted'

export type SafePermissions = { [origin: string]: Permission[] }

export type SafePermissionsRequest = {
  origin: string
  requestId: string
  request: PermissionRequest[]
}

type SafePermissionChangeSet = { capability: string; selected: boolean }[]

type UseSafePermissionsReturnType = {
  permissions: SafePermissions
  getPermissions: (origin: string) => Permission[]
  updatePermission: (origin: string, changeset: SafePermissionChangeSet) => void
  removePermissions: (origin: string) => void
  permissionsRequest: SafePermissionsRequest | undefined
  setPermissionsRequest: (permissionsRequest?: SafePermissionsRequest) => void
  confirmPermissionRequest: (result: PermissionStatus) => Permission[]
  hasPermission: (origin: string, permission: Methods) => boolean
  isUserRestricted: (caveats?: PermissionCaveat[]) => boolean
}

const useSafePermissions = (): UseSafePermissionsReturnType => {
  const [permissions = {}, setPermissions] = useLocalStorage<SafePermissions>(SAFE_PERMISSIONS)

  const [permissionsRequest, setPermissionsRequest] = useState<SafePermissionsRequest | undefined>()

  const getPermissions = useCallback(
    (origin: string) => {
      return permissions[trimTrailingSlash(origin)] || []
    },
    [permissions],
  )

  const updatePermission = useCallback(
    (origin: string, changeset: SafePermissionChangeSet) => {
      const appUrl = trimTrailingSlash(origin)

      setPermissions({
        ...permissions,
        [appUrl]: permissions[appUrl].map((permission) => {
          const change = changeset.find((change) => change.capability === permission.parentCapability)

          if (change) {
            if (change.selected) {
              permission.caveats = permission.caveats?.filter((caveat) => caveat.type !== USER_RESTRICTED) || []
            } else if (!isUserRestricted(permission.caveats)) {
              permission.caveats = [
                ...(permission.caveats || []),
                {
                  type: USER_RESTRICTED,
                  value: true,
                },
              ]
            }
          }

          return permission
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

  const hasPermission = useCallback(
    (origin: string, permission: Methods) => {
      return permissions[trimTrailingSlash(origin)]?.some(
        (p) => p.parentCapability === permission && !isUserRestricted(p.caveats),
      )
    },
    [permissions],
  )

  const hasCapability = useCallback(
    (origin: string, permission: Methods) => {
      return permissions[trimTrailingSlash(origin)]?.some((p) => p.parentCapability === permission)
    },
    [permissions],
  )

  const confirmPermissionRequest = useCallback(
    (result: PermissionStatus) => {
      if (!permissionsRequest) return []

      const updatedPermissionsByOrigin = [...(permissions[permissionsRequest.origin] || [])]

      permissionsRequest.request.forEach((requestedPermission) => {
        const capability = Object.keys(requestedPermission)[0]

        if (hasCapability(permissionsRequest.origin, capability as Methods)) {
          updatedPermissionsByOrigin.map((permission) => {
            if (permission.parentCapability === capability) {
              if (isUserRestricted(permission.caveats)) {
                if (result === PermissionStatus.GRANTED) {
                  permission.caveats = permission.caveats?.filter((caveat) => caveat.type !== USER_RESTRICTED) || []
                }
              } else {
                if (result === PermissionStatus.DENIED) {
                  permission.caveats?.push({
                    type: USER_RESTRICTED,
                    value: true,
                  })
                }
              }
            }
          })
        } else {
          updatedPermissionsByOrigin.push({
            invoker: permissionsRequest.origin,
            parentCapability: capability,
            date: new Date().getTime(),
            caveats:
              result === PermissionStatus.DENIED
                ? [
                    {
                      type: USER_RESTRICTED,
                      value: true,
                    },
                  ]
                : [],
          })
        }
      })

      setPermissions({
        ...permissions,
        [permissionsRequest.origin]: updatedPermissionsByOrigin,
      })
      setPermissionsRequest(undefined)

      return updatedPermissionsByOrigin
    },
    [permissionsRequest, permissions, setPermissions, hasCapability],
  )

  const isUserRestricted = (caveats?: PermissionCaveat[]) =>
    !!caveats?.some((caveat) => caveat.type === USER_RESTRICTED && caveat.value === true)

  return {
    permissions,
    isUserRestricted,
    getPermissions,
    updatePermission,
    removePermissions,
    permissionsRequest,
    setPermissionsRequest,
    confirmPermissionRequest,
    hasPermission,
  }
}

export { useSafePermissions }
