import useSpendingLimits from '@/features/spending-limits/public/hooks/useSpendingLimits'
import { type RolePropsMap, Role } from '../config'

/**
 * Hook to get the props for each role based on the current state of the application.
 * @returns Object with the props per role.
 */
export const useRoleProps = (): RolePropsMap => {
  const { spendingLimits } = useSpendingLimits()

  return {
    [Role.SpendingLimitBeneficiary]: { spendingLimits },
  }
}
