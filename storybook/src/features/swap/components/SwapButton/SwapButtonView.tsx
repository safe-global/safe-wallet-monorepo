import Track from '@/components/common/Track'
import type { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { SWAP_EVENTS } from '@/services/analytics/events/swaps'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { ReactElement } from 'react'
import SwapIcon from '@/public/images/common/swap.svg'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

export type SwapButtonViewProps = {
  isOk: boolean
  onClick: () => void
  trackingLabel: SWAP_LABELS
  mixpanelParams: Record<string, string>
  light: boolean
  onlyIcon: boolean
}

export const SwapButtonView = ({
  isOk,
  onClick,
  trackingLabel,
  mixpanelParams,
  light,
  onlyIcon,
}: SwapButtonViewProps): ReactElement => {
  return (
    <Track {...SWAP_EVENTS.OPEN_SWAPS} label={trackingLabel} mixpanelParams={mixpanelParams}>
      {onlyIcon ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span>
                <Button
                  data-testid="swap-btn"
                  onClick={onClick}
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
          onClick={onClick}
          disabled={!isOk}
          className={assetActionCss.sendButton}
        >
          <SwapIcon />
          Swap
        </Button>
      )}
    </Track>
  )
}
