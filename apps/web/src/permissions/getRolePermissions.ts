import rolePermissionConfig from './config'
import type { CommonProps, PermissionSet, Role, RoleProps } from './config'

/**
 * Get the PermissionSet for multiple roles with the given role props object.
 * @param roles Roles to get permissions for
 * @param props Common props used to evaluate the permissions
 * @param roleProps Object with specific parameters for the roles
 * @returns Object with PermissionSet for each of the give roles that has permissions defined
 */
export const getRolePermissions = <R extends Role>(
  roles: R[],
  props: CommonProps,
  roleProps: { [K in R]?: RoleProps<K> },
) =>
  roles.reduce<{ [_K in R]?: PermissionSet }>((acc, role) => {
    const rolePermissionsFn = rolePermissionConfig[role]

    if (!rolePermissionsFn) {
      return acc
    }

    return { ...acc, [role]: rolePermissionsFn(props, roleProps[role] as RoleProps<R>) }
  }, {})
