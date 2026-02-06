import { useIsWalletProposer } from '@/hooks/useProposers'
import { useAppSelector } from '@/store'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { selectSpendingLimits } from '../store/spendingLimitsSlice'

/**
 * Check if the current wallet is a spending limit beneficiary.
 * Data is loaded on app start via SpendingLimitsLoader.
 */
export const useIsSpendingLimitBeneficiary = (): boolean => {
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const wallet = useWallet()

  if (!isEnabled || spendingLimits.length === 0) {
    return false
  }

  return spendingLimits.some(({ beneficiary }) => beneficiary === wallet?.address)
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
