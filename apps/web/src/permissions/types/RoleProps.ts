import type { SpendingLimitState } from '@/store/spendingLimitsSlice'
import type { Role } from './Role'

/**
 * RolePropsMap defines property types for specific roles.
 * The props are used to specify conditional permission values for the respective role.
 */
export type RolePropsMap = {
  [Role.SpendingLimitBeneficiary]: {
    spendingLimits: SpendingLimitState[]
  }
}

// Extract the props for a specific role from RolePropsMap
export type RoleProps<R extends Role> = R extends keyof RolePropsMap ? RolePropsMap[R] : undefined
