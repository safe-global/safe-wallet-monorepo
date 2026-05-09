import useBalances from '@/hooks/useBalances'
import { useIsStakingBannerEnabled as useIsStakingPromoEnabled } from '@/features/stake'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useMemo } from 'react'
import { formatUnits } from 'ethers'
import { TokenType } from '@safe-global/store/gateway/types'

const MIN_NATIVE_TOKEN_BALANCE = 32

const useIsStakingBannerVisible = () => {
  const { balances } = useBalances()
  const isStakingBannerEnabled = useIsStakingPromoEnabled()
  const sanctionedAddress = useSanctionedAddress(isStakingBannerEnabled)

  const nativeTokenBalance = useMemo(
    () => balances.items.find((balance) => balance.tokenInfo.type === TokenType.NATIVE_TOKEN),
    [balances.items],
  )

  const hasSufficientFunds =
    nativeTokenBalance != null &&
    Number(formatUnits(nativeTokenBalance.balance, nativeTokenBalance.tokenInfo.decimals ?? 0)) >=
      MIN_NATIVE_TOKEN_BALANCE

  return isStakingBannerEnabled && !Boolean(sanctionedAddress) && hasSufficientFunds
}

export default useIsStakingBannerVisible
