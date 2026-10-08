import CheckWallet from '@/components/common/CheckWallet'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import { TokenType } from '@safe-global/store/gateway/types'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import type { STAKE_LABELS } from '@/services/analytics/events/stake'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentChain } from '@/hooks/useChains'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { StakeButtonView } from '@views/features/stake/components/StakeButton/StakeButtonView'

const StakeButton = ({
  tokenInfo,
  trackingLabel,
  compact = true,
  onlyIcon = false,
}: {
  tokenInfo: Balance['tokenInfo']
  trackingLabel: STAKE_LABELS
  compact?: boolean
  onlyIcon?: boolean
}): ReactElement => {
  const spendingLimit = useSpendingLimit(tokenInfo)
  const chain = useCurrentChain()
  const router = useRouter()

  const handleClick = () => {
    router.push({
      pathname: AppRoutes.stake,
      query: {
        ...router.query,
        asset: `${chain?.shortName}_${tokenInfo.type === TokenType.NATIVE_TOKEN ? 'NATIVE_TOKEN' : tokenInfo.address}`,
      },
    })
  }

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <StakeButtonView
          isOk={isOk}
          onClick={handleClick}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: trackingLabel,
          }}
          compact={compact}
          onlyIcon={onlyIcon}
        />
      )}
    </CheckWallet>
  )
}

export default StakeButton
