import { useMemo } from 'react'
import { useRoles } from './useRoles'
import { useRoleProps } from './useRoleProps'
import { getRolePermissions } from '../getRolePermissions'
import type { Permission, Role, PermissionProps } from '../config'

/**
 * Hook to get the result of a permission check for the current user based on the Safe and the connected wallet.
 * @param permission Permission to check.
 * @param props Specific props to pass to the permission function (only required if configured for the permission).
 * @returns Object with the result of the permission check for each role that the user has.
 */
export const usePermission = <P extends Permission>(
  permission: P,
  ...[props]: PermissionProps<P> extends undefined ? [] : [props: PermissionProps<P>]
): { [_R in Role]?: boolean } => {
  const userRoles = useRoles()
  const roleProps = useRoleProps()

  const userPermissions = useMemo(() => {
    return getRolePermissions(userRoles, roleProps)
  }, [userRoles, roleProps])

  const permissionPerRole = useMemo(() => {
    return Object.entries(userPermissions).reduce((acc, [role, permissions]) => {
      const permissionValue = permissions?.[permission]

      if (permissionValue === undefined) {
        // No permission defined for the role
        return acc
      }

      if (typeof permissionValue === 'function') {
        // Evaluate the permission function with the given props
        return { ...acc, [role]: permissionValue(props as PermissionProps<P>) }
      }

      // Return the permission value (boolean) as is
      return { ...acc, [role]: permissionValue }
    }, {})
  }, [userPermissions, permission, props])

  return permissionPerRole
}
