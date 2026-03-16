import { useIsOnlySpendingLimitBeneficiary, useSpendingLimit, selectSpendingLimits } from '@/features/spending-limits'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useTrustedTokenBalances } from '@/hooks/loadables/useTrustedTokenBalances'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useMemo } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TokenType } from '@safe-global/store/gateway/types'

export const useTokenAmount = (selectedToken: Balances['items'][0] | undefined) => {
  const spendingLimit = useSpendingLimit(selectedToken?.tokenInfo)

  const spendingLimitAmount = BigInt(spendingLimit?.amount || 0) - BigInt(spendingLimit?.spent || 0)
  const totalAmount = BigInt(selectedToken?.balance || 0)

  return { totalAmount, spendingLimitAmount }
}

const filterHiddenTokens = (items: Balances['items'], hiddenAssets: string[]) =>
  items.filter((balanceItem) => !hiddenAssets.includes(balanceItem.tokenInfo.address))

export const useVisibleTokens = () => {
  const isOnlySpendingLimitBeneficiary = useIsOnlySpendingLimitBeneficiary()
  const [balances] = useTrustedTokenBalances()
  const spendingLimits = useAppSelector(selectSpendingLimits)
  const wallet = useWallet()
  const hiddenTokens = useHiddenTokens()
  const hideNativeToken = useHasFeature(FEATURES.HIDE_NATIVE_TOKEN)

  return useMemo(() => {
    if (!balances) {
      return []
    }

    let items = filterHiddenTokens(balances.items, hiddenTokens)

    if (hideNativeToken) {
      items = items.filter((item) => item.tokenInfo.type !== TokenType.NATIVE_TOKEN)
    }

    if (isOnlySpendingLimitBeneficiary) {
      return items.filter(({ tokenInfo }) => {
        return spendingLimits?.some(({ beneficiary, token }) => {
          return sameAddress(beneficiary, wallet?.address) && sameAddress(tokenInfo.address, token.address)
        })
      })
    }

    return items
  }, [balances, hiddenTokens, hideNativeToken, isOnlySpendingLimitBeneficiary, spendingLimits, wallet?.address])
}
