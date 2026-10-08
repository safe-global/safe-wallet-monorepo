import CheckWallet from '@/components/common/CheckWallet'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'

import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { EarnButtonProps } from '../../types'
import { EarnButtonView } from '@views/features/earn/components/EarnButton/EarnButtonView'

const EarnButton = (props: EarnButtonProps): ReactElement => {
  const { tokenInfo, trackingLabel, compact = true, onlyIcon = false } = props
  const spendingLimit = useSpendingLimit(tokenInfo)
  const chain = useCurrentChain()
  const router = useRouter()

  const onEarnClick = () => {
    router.push({
      pathname: AppRoutes.earn,
      query: {
        ...router.query,
        asset_id: `${chain?.chainId}_${tokenInfo.address}`,
      },
    })
  }

  return (
    <EarnButtonView
      mixpanelParams={{
        [MixpanelEventParams.ENTRY_POINT]: trackingLabel,
      }}
      compact={compact}
      onlyIcon={onlyIcon}
      onEarnClick={onEarnClick}
      checkWallet={(render) => <CheckWallet allowSpendingLimit={!!spendingLimit}>{render}</CheckWallet>}
    />
  )
}

export default EarnButton
