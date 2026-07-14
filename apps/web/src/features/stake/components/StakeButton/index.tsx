import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { TokenType } from '@safe-global/store/gateway/types'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import StakeIcon from '@/public/images/common/stake.svg'
import type { STAKE_LABELS } from '@/services/analytics/events/stake'
import { STAKE_EVENTS } from '@/services/analytics/events/stake'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import classnames from 'classnames'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import assetActionCss from '@/components/common/AssetActionButton/styles.module.css'

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
        <Track
          {...STAKE_EVENTS.STAKE_VIEWED}
          mixpanelParams={{
            [MixpanelEventParams.ENTRY_POINT]: trackingLabel,
          }}
        >
          {onlyIcon ? (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  data-testid="stake-btn"
                  aria-label="Stake"
                  onClick={handleClick}
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
              onClick={handleClick}
              disabled={!isOk}
            >
              <StakeIcon className="size-4" />
              Stake
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default StakeButton
