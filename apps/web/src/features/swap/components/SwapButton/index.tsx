import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import { SWAP_EVENTS } from '@/services/analytics/events/swaps'
import type { SWAP_LABELS as SWAP_LABELS_TYPE } from '@/services/analytics/events/swaps'
import { MixPanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { Button } from '@mui/material'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import SwapIcon from '@/public/images/common/swap.svg'

const SwapButton = ({
  tokenInfo,
  amount,
  trackingLabel,
  light = false,
}: {
  tokenInfo: TokenInfo
  amount: string
  trackingLabel: SWAP_LABELS_TYPE
  light?: boolean
}): ReactElement => {
  const spendingLimit = useSpendingLimit(tokenInfo)
  const router = useRouter()

  return (
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <Track
          {...SWAP_EVENTS.OPEN_SWAPS}
          label={trackingLabel}
          mixpanelParams={{
            [MixPanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[trackingLabel] || 'Home',
          }}
        >
          <Button
            data-testid="swap-btn"
            variant="contained"
            color={light ? 'background.paper' : 'primary'}
            size="compact"
            startIcon={<SwapIcon />}
            disableElevation
            onClick={() => {
              router.push({
                pathname: AppRoutes.swap,
                query: {
                  ...router.query,
                  token: tokenInfo.address,
                  amount,
                },
              })
            }}
            disabled={!isOk}
          >
            Swap
          </Button>
        </Track>
      )}
    </CheckWallet>
  )
}

export default SwapButton
