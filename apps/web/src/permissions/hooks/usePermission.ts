import { useMemo } from 'react'
import { Permission, PermissionProps, Role } from '../types'
import { usePermissions } from './usePermissions'

/**
 * Hook to get the result of a permission check for the current user based on the Safe and the connected wallet.
 * @param permission Permission to check.
 * @param props Specific props to pass to the permission function (only required if configured for the permission).
 * @returns Object with the result of the permission check for each role that the user has.
 */
export const usePermission = <P extends Permission, Props extends PermissionProps<P> = PermissionProps<P>>(
  permission: P,
  ...[props]: Props extends undefined ? [] : [props: Props]
): { [K in Role]?: boolean } => {
  const userPermissions = usePermissions()

  const permissionPerRole = useMemo(() => {
    return Object.entries(userPermissions).reduce((acc, [role, permissions]) => {
      const permissionValue = permissions?.[permission]

      if (!permissionValue) {
        // No permission defined for the role
        return acc
      }

      if (typeof permissionValue === 'function' && props) {
        // Evaluate the permission function with the given props
        return { ...acc, [role]: permissionValue(props) }
      }

      // Return the permission value (boolean) as is
      return { ...acc, [role]: permissionValue }
    }, {})
  }, [userPermissions, permission, props])

  return permissionPerRole
}
