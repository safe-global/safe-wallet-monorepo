import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import { Button, IconButton, Tooltip, SvgIcon } from '@mui/material'

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
            <Tooltip title={isOk ? 'Earn' : ''} placement="top" arrow>
              <span>
                <IconButton
                  data-testid="earn-btn"
                  aria-label="Earn"
                  onClick={onEarnClick}
                  disabled={!isOk}
                  size="small"
                  className={assetActionCss.assetActionIconButton}
                >
                  <SvgIcon component={EarnIcon} inheritViewBox />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button
              className={classnames({ [css.button]: compact, [css.buttonDisabled]: !isOk })}
              data-testid="earn-btn"
              aria-label="Earn"
              variant={compact ? 'text' : 'contained'}
              color={compact ? 'info' : 'background.paper'}
              size="small"
              disableElevation
              startIcon={<EarnIcon />}
              onClick={onEarnClick}
              disabled={!isOk}
            >
              Earn
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default EarnButton
