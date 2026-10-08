import { isSafeToken } from '@/utils/safe-token'
import useBalances from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { SafenetStakingButtonView } from '@views/components/common/Header/Topbar/SafenetStakingButtonView'

const SafenetStakingButton = () => {
  const chainId = useChainId()
  const { balances, loading } = useBalances()
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  const safeTokenItem = balances.items.find((item) => isSafeToken(chainId, item.tokenInfo.address))
  const safeBalance = safeTokenItem
    ? formatVisualAmount(safeTokenItem.balance, safeTokenItem.tokenInfo.decimals, 0)
    : '0'

  return (
    <SafenetStakingButtonView
      safeBalance={safeBalance}
      loading={loading}
      isNavigating={isNavigating}
      onClick={openSafenetStakingApp}
    />
  )
}

export default SafenetStakingButton
