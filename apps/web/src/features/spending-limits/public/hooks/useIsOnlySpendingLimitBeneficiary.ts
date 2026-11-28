import { useIsWalletProposer } from '@/hooks/useProposers'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useSpendingLimits from './useSpendingLimits'

/**
 * Check if the current wallet is a spending limit beneficiary.
 */
export const useIsSpendingLimitBeneficiary = (): boolean => {
  const { spendingLimits } = useSpendingLimits()
  const wallet = useWallet()

  return spendingLimits.some(({ beneficiary }) => sameAddress(beneficiary, wallet?.address))
}

/**
 * Check if the current wallet is ONLY a spending limit beneficiary (not an owner or proposer).
 */
const useIsOnlySpendingLimitBeneficiary = (): boolean => {
  const isSpendingLimitBeneficiary = useIsSpendingLimitBeneficiary()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  return !isSafeOwner && !isProposer && isSpendingLimitBeneficiary
}

export default useIsOnlySpendingLimitBeneficiary
