import { useIsWalletProposer } from '@/hooks/useProposers'
import { useAppSelector } from '@/store'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsSpendingLimitBeneficiary = (): boolean => {
  const isEnabled = useHasFeature(FEATURES.SPENDING_LIMIT)
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const wallet = useWallet()

  if (!isEnabled || spendingLimits.length === 0) {
    return false
  }

  return spendingLimits.some(({ beneficiary }) => beneficiary === wallet?.address)
}

const useIsOnlySpendingLimitBeneficiary = (): boolean => {
  const isSpendingLimitBeneficiary = useIsSpendingLimitBeneficiary()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  return !isSafeOwner && !isProposer && isSpendingLimitBeneficiary
}

export default useIsOnlySpendingLimitBeneficiary
