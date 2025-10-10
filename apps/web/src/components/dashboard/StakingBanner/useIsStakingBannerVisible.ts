import usePortfolio from '@/hooks/usePortfolio'
import useIsStakingPromoEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useMemo } from 'react'
import { formatUnits } from 'ethers'
import { TokenType } from '@safe-global/store/gateway/types'

const MIN_NATIVE_TOKEN_BALANCE = 32

const useIsStakingBannerVisible = () => {
  const { tokenBalances } = usePortfolio()
  const isStakingBannerEnabled = useIsStakingPromoEnabled()
  const sanctionedAddress = useSanctionedAddress(isStakingBannerEnabled)

  const nativeTokenBalance = useMemo(
    () => tokenBalances.find((balance) => balance.tokenInfo.type === TokenType.NATIVE_TOKEN),
    [tokenBalances],
  )

  const hasSufficientFunds =
    nativeTokenBalance != null &&
    Number(formatUnits(nativeTokenBalance.balance, nativeTokenBalance.tokenInfo.decimals ?? 0)) >=
      MIN_NATIVE_TOKEN_BALANCE

  return isStakingBannerEnabled && !Boolean(sanctionedAddress) && hasSufficientFunds
}

export default useIsStakingBannerVisible
