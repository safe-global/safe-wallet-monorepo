import useBalances from '@/hooks/useBalances'
import useIsStakingBannerEnabled from '@/features/stake/hooks/useIsStakingBannerEnabled'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import { useMemo } from 'react'
import { formatUnits } from 'ethers'
import { TokenType } from '@safe-global/safe-gateway-typescript-sdk'

const MIN_NATIVE_TOKEN_BALANCE = 32

const useIsStakingBannerVisible = () => {
  const { balances } = useBalances()
  const isStakingBannerEnabled = useIsStakingBannerEnabled()
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
