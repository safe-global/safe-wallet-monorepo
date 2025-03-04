import { useEffect, useState } from 'react'
import { useRoles } from './useRoles'
import { intersection, uniq } from 'lodash'
import type { Role } from '../config'

/**
 * Hook to check if the current user has the given roles.
 * @param rolesToCheck roles that the user must have to return true
 * @param exclusive whether the user must have only the roles to check
 * @returns true if the user has the roles to check, false otherwise
 */
export const useHasRoles = (rolesToCheck: Role[], exclusive = false): boolean => {
  const roles = useRoles()
  const [hasRoles, setHasRoles] = useState<boolean>(false)

  useEffect(() => {
    const uniqueRolesToCheck = uniq(rolesToCheck)
    const rolesIntersection = intersection(rolesToCheck, roles)
    const hasRolesNew = rolesIntersection.length === uniqueRolesToCheck.length

    if (exclusive) {
      setHasRoles(hasRolesNew && uniq(roles).length === uniqueRolesToCheck.length)
    } else {
      setHasRoles(hasRolesNew)
    }
  }, [rolesToCheck, roles, exclusive])

  return hasRoles
}
