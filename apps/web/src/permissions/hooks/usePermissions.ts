import { useMemo } from 'react'
import { useRoles } from './useRoles'
import type { Role, PermissionSet } from '../types'
import { useRoleProps } from './useRoleProps'
import { getRolePermissions } from '../getRolePermissions'

/**
 * Hook to get the permissions per role that the current user has based on the Safe and the connected wallet.
 * @returns Object that maps each role that the user has to its PermissionSet (if any defined).
 */
export const usePermissions = (): { [K in Role]?: PermissionSet } => {
  const userRoles = useRoles()
  const roleProps = useRoleProps()

  const permissionSet = useMemo(() => {
    return getRolePermissions(userRoles, roleProps)
  }, [userRoles, roleProps])

  return permissionSet
}
