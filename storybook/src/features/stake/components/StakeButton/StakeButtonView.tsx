import Track from '@/components/common/Track'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { ReactElement } from 'react'
import StakeIcon from '@/public/images/common/stake.svg'
import { STAKE_EVENTS } from '@/services/analytics/events/stake'
import css from './styles.module.css'
import classnames from 'classnames'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

export type StakeButtonViewProps = {
  isOk: boolean
  onClick: () => void
  mixpanelParams: Record<string, string>
  compact: boolean
  onlyIcon: boolean
}

export const StakeButtonView = ({
  isOk,
  onClick,
  mixpanelParams,
  compact,
  onlyIcon,
}: StakeButtonViewProps): ReactElement => {
  return (
    <Track {...STAKE_EVENTS.STAKE_VIEWED} mixpanelParams={mixpanelParams}>
      {onlyIcon ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="stake-btn"
              aria-label="Stake"
              onClick={onClick}
              disabled={!isOk}
              className={assetActionCss.assetActionIconButton}
            >
              <StakeIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          {isOk && <TooltipContent>Stake</TooltipContent>}
        </Tooltip>
      ) : (
        <Button
          className={classnames({ [css.button]: compact, [css.buttonDisabled]: !isOk })}
          data-testid="stake-btn"
          aria-label="Stake"
          variant={compact ? 'ghost' : 'surface'}
          size="sm"
          onClick={onClick}
          disabled={!isOk}
        >
          <StakeIcon className="size-4" />
          Stake
        </Button>
      )}
    </Track>
  )
}
