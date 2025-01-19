import rolePermissionConfig from './config'
import type { PermissionSet, Role, RoleProps } from './types'

/**
 * Get the PermissionSet for a specific role with the given props.
 * @param role Role to get permissions for
 * @param props Specific parameters for the role
 * @returns PermissionSet for the role or undefined if no permissions are defined for the role
 */
const getRolePermissionSet = <R extends Role>(role: R, props: RoleProps<R>) => {
  const rolePermissionsFn = rolePermissionConfig[role]

  if (!rolePermissionsFn) {
    return undefined
  }

  return rolePermissionsFn(props)
}

/**
 * Get the PermissionSet for multiple roles with the given role props object.
 * @param roles Roles to get permissions for
 * @param props Object with specific parameters for the roles
 * @returns Object with PermissionSet for each of the give roles that has permissions defined
 */
export const getRolePermissions = <R extends Role>(roles: R[], props: { [K in R]?: RoleProps<K> }) =>
  roles.reduce<{ [_K in R]?: PermissionSet }>((acc, role) => {
    const rolePermissionSet = getRolePermissionSet(role, props[role] as RoleProps<R>)

    if (!rolePermissionSet) {
      return acc
    }

    return { ...acc, [role]: rolePermissionSet }
  }, {})
