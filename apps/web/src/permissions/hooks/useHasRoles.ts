import { useEffect, useState } from 'react'
import type { Role } from '../types'
import { useRoles } from './useRoles'
import { isArrayEqualSet } from '../utils'

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
    const rolesToCheckSet = new Set(rolesToCheck)

    if (exclusive) {
      setHasRoles(isArrayEqualSet(roles, rolesToCheckSet))
    } else {
      setHasRoles(rolesToCheckSet.isSubsetOf(new Set(roles)))
    }
  }, [rolesToCheck, roles, exclusive])

  return hasRoles
}
