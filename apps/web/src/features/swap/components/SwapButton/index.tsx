import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import { useSpendingLimit } from '@/features/spending-limits'
import type { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { SWAP_EVENTS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { Button, IconButton, Tooltip, SvgIcon } from '@mui/material'
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
            <Tooltip title={isOk ? 'Swap' : ''} placement="top" arrow>
              <span>
                <IconButton
                  data-testid="swap-btn"
                  onClick={handleClick}
                  disabled={!isOk}
                  size="small"
                  aria-label="Swap"
                  className={assetActionCss.assetActionIconButton}
                >
                  <SvgIcon component={SwapIcon} inheritViewBox />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button
              data-testid="swap-btn"
              variant="contained"
              color={light ? 'background.paper' : 'primary'}
              size="medium"
              startIcon={<SwapIcon />}
              disableElevation
              onClick={handleClick}
              disabled={!isOk}
              className={assetActionCss.sendButton}
            >
              Swap
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default SwapButton
