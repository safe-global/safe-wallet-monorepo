import rolePermissionConfig from './config'
import type { PermissionSet, Role, RoleProps } from './types'

/**
 * Get the PermissionSet for multiple roles with the given role props object.
 * @param roles Roles to get permissions for
 * @param props Object with specific parameters for the roles
 * @returns Object with PermissionSet for each of the give roles that has permissions defined
 */
export const getRolePermissions = <R extends Role>(roles: R[], props: { [K in R]?: RoleProps<K> }) =>
  roles.reduce<{ [_K in R]?: PermissionSet }>((acc, role) => {
    const rolePermissionsFn = rolePermissionConfig[role]

    if (!rolePermissionsFn) {
      return acc
    }

    return { ...acc, [role]: rolePermissionsFn(props[role] as RoleProps<R>) }
  }, {})
