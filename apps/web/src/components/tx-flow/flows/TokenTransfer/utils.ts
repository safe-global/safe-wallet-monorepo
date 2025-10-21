import useIsOnlySpendingLimitBeneficiary from '@/hooks/useIsOnlySpendingLimitBeneficiary'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import usePortfolio from '@/hooks/usePortfolio'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectSpendingLimits } from '@/store/spendingLimitsSlice'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

export const useTokenAmount = (selectedToken: Balance | undefined) => {
  const spendingLimit = useSpendingLimit(selectedToken?.tokenInfo)

  const spendingLimitAmount = BigInt(spendingLimit?.amount || 0) - BigInt(spendingLimit?.spent || 0)
  const totalAmount = BigInt(selectedToken?.balance || 0)

  return { totalAmount, spendingLimitAmount }
}

export const useVisibleTokens = () => {
  const isOnlySpendingLimitBeneficiary = useIsOnlySpendingLimitBeneficiary()
  const { visibleTokenBalances } = usePortfolio()
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const wallet = useWallet()

  if (isOnlySpendingLimitBeneficiary) {
    return visibleTokenBalances.filter(({ tokenInfo }) => {
      return spendingLimits?.some(({ beneficiary, token }) => {
        return sameAddress(beneficiary, wallet?.address) && sameAddress(tokenInfo.address, token.address)
      })
    })
  }

  return visibleTokenBalances
}
