import CheckWallet from '@/components/common/CheckWallet'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import type { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { SwapButtonView } from '@views/features/swap/components/SwapButton/SwapButtonView'

const SwapButton = ({
  tokenInfo,
  amount,
  trackingLabel,
  light = false,
  onlyIcon = false,
}: {
  tokenInfo: Balance['tokenInfo']
  amount: string
  trackingLabel: SWAP_LABELS
  light?: boolean
  onlyIcon?: boolean
}): ReactElement => {
  const spendingLimit = useSpendingLimit(tokenInfo)
  const router = useRouter()

  const handleClick = () => {
    router.push({
      pathname: AppRoutes.swap,
      query: {
        ...router.query,
        token: tokenInfo.address,
        amount,
      },
    })
  }

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <SwapButtonView
          isOk={isOk}
          onClick={handleClick}
          trackingLabel={trackingLabel}
          mixpanelParams={{ [MixpanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[trackingLabel] || 'Home' }}
          light={light}
          onlyIcon={onlyIcon}
        />
      )}
    </CheckWallet>
  )
}

export default SwapButton
