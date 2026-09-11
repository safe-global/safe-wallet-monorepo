import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import type { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { SWAP_EVENTS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import SwapIcon from '@/public/images/common/swap.svg'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

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
        <Track
          {...SWAP_EVENTS.OPEN_SWAPS}
          label={trackingLabel}
          mixpanelParams={{ [MixpanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[trackingLabel] || 'Home' }}
        >
          {onlyIcon ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span>
                    <Button
                      data-testid="swap-btn"
                      onClick={handleClick}
                      disabled={!isOk}
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Swap"
                      className={assetActionCss.assetActionIconButton}
                    >
                      <SwapIcon />
                    </Button>
                  </span>
                }
              />
              {isOk ? <TooltipContent>Swap</TooltipContent> : null}
            </Tooltip>
          ) : (
            <Button
              data-testid="swap-btn"
              variant={light ? 'outline' : 'default'}
              onClick={handleClick}
              disabled={!isOk}
              className={assetActionCss.sendButton}
            >
              <SwapIcon />
              Swap
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default SwapButton
