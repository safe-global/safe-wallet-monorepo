import { useMemo } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useIsRecoverer } from '@/features/recovery/hooks/useIsRecoverer'
import { useIsSpendingLimitBeneficiary } from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import useWallet from '@/hooks/wallets/useWallet'
import { Role } from '../config'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'

/**
 * Hook to get the roles that the current user has based on the Safe and the connected wallet.
 * @returns Array with the roles that the current user has.
 */
export const useRoles = (): Role[] => {
  const wallet = useWallet()
  const isOwner = useIsSafeOwner()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const isProposer = useIsWalletProposer()
  const isRecoverer = useIsRecoverer()
  const isSpendingLimitBeneficiary = useIsSpendingLimitBeneficiary()

  // Map of roles and whether they are applicable to the current user
  const roleApplicableMap: Record<Role, boolean> = useMemo(
    () => ({
      [Role.Owner]: isOwner,
      [Role.NestedOwner]: !!isNestedSafeOwner,
      [Role.Proposer]: !!isProposer,
      [Role.Recoverer]: isRecoverer,
      [Role.SpendingLimitBeneficiary]: isSpendingLimitBeneficiary,
      [Role.Executioner]: !!wallet,
      [Role.NoWalletConnected]: !wallet,
      [Role.ModuleRole]: false, // TODO: Implement module role
    }),
    [isOwner, isNestedSafeOwner, isProposer, isRecoverer, isSpendingLimitBeneficiary, wallet],
  )

  const roles = useMemo(
    () =>
      (Object.entries(roleApplicableMap) as [[Role, boolean]]).reduce<Role[]>(
        (acc, [role, isApplicable]) => (isApplicable ? [...acc, role] : acc),
        [],
      ),
    [roleApplicableMap],
  )

  return roles
}
