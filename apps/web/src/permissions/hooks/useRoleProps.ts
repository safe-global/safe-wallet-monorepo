import { useSelector } from 'react-redux'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { type RolePropsMap, Role } from '../config'

/**
 * Hook to get the props for each role based on the current state of the application.
 * @returns Object with the props per role.
 */
export const useRoleProps = (): RolePropsMap => {
  const spendingLimits = useSelector(selectSpendingLimits)

  return {
    [Role.SpendingLimitBeneficiary]: { spendingLimits },
  }
}
