import type { Permission, PermissionProps } from '../config'
import { usePermission } from './usePermission'

/**
 * Hook to check if the current user has a specific permission.
 * @param permission Permission to check.
 * @param props Specific props to pass to the permission function (only required if configured for the permission).
 * @returns Boolean indicating if the user has the permission.
 */
export const useHasPermission = <P extends Permission, Props extends PermissionProps<P> = PermissionProps<P>>(
  permission: P,
  ...props: Props extends undefined ? [] : [props: Props]
): boolean => {
  const permissions = usePermission(permission, ...props)

  return Object.values(permissions).some((flag) => flag)
}
