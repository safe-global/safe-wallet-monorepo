import Track from '@/components/common/Track'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ReactElement, ReactNode } from 'react'
import EarnIcon from '@/public/images/common/earn.svg'
import { EARN_EVENTS } from '@/services/analytics/events/earn'
import css from './styles.module.css'
import classnames from 'classnames'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

export type EarnButtonViewProps = {
  mixpanelParams: Record<string, string>
  compact: boolean
  onlyIcon: boolean
  onEarnClick: () => void
  checkWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
}

export const EarnButtonView = ({
  mixpanelParams,
  compact,
  onlyIcon,
  onEarnClick,
  checkWallet,
}: EarnButtonViewProps) => {
  return (
    <>
      {checkWallet((isOk) => (
        <Track {...EARN_EVENTS.EARN_VIEWED} mixpanelParams={mixpanelParams}>
          {onlyIcon ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      data-testid="earn-btn"
                      aria-label="Earn"
                      onClick={onEarnClick}
                      disabled={!isOk}
                      className={assetActionCss.assetActionIconButton}
                    >
                      <EarnIcon />
                    </Button>
                  </span>
                }
              />
              {isOk && <TooltipContent>Earn</TooltipContent>}
            </Tooltip>
          ) : (
            <Button
              className={classnames('gap-1', {
                [css.button]: compact,
                [css.buttonDisabled]: !isOk,
              })}
              data-testid="earn-btn"
              aria-label="Earn"
              variant={compact ? 'ghost' : 'surface'}
              size="sm"
              onClick={onEarnClick}
              disabled={!isOk}
            >
              <EarnIcon />
              Earn
            </Button>
          )}
        </Track>
      ))}
    </>
  )
}
