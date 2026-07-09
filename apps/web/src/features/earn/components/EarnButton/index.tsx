import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import EarnIcon from '@/public/images/common/earn.svg'
import { EARN_EVENTS } from '@/services/analytics/events/earn'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import classnames from 'classnames'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'
import type { EarnButtonProps } from '../../types'

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
    <CheckWallet allowSpendingLimit={!!spendingLimit}>
      {(isOk) => (
        <Track
          {...EARN_EVENTS.EARN_VIEWED}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: trackingLabel,
          }}
        >
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
                // eslint-disable-next-line no-restricted-syntax -- on-surface Earn CTA needs a paper bg; pending an on-color variant
                'bg-[var(--color-background-paper)]': !compact,
              })}
              data-testid="earn-btn"
              aria-label="Earn"
              variant={compact ? 'ghost' : 'default'}
              size="sm"
              onClick={onEarnClick}
              disabled={!isOk}
            >
              <EarnIcon />
              Earn
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default EarnButton
