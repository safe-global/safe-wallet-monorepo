import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import { Button, SvgIcon, Typography, Box } from '@mui/material'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import EarnIcon from '@/public/images/common/earn.svg'
import { EARN_EVENTS, type EARN_LABELS } from '@/services/analytics/events/earn'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import classnames from 'classnames'

const EarnButton = ({
  tokenInfo,
  trackingLabel,
  compact = true,
  plain = false,
}: {
  tokenInfo: Balance['tokenInfo']
  trackingLabel: EARN_LABELS
  compact?: boolean
  plain?: boolean
}): ReactElement => {
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
          {plain ? (
            <Box
              component="span"
              className={classnames(css.plainButton, { [css.plainButtonDisabled]: !isOk })}
              data-testid="earn-btn"
              onClick={isOk ? onEarnClick : undefined}
              aria-label="Earn"
              aria-disabled={!isOk}
            >
              <SvgIcon component={EarnIcon} inheritViewBox className={css.plainIcon} />
              <Typography component="span" variant="body2">
                Earn
              </Typography>
            </Box>
          ) : (
            <Button
              className={classnames({ [css.button]: compact, [css.buttonDisabled]: !isOk })}
              data-testid="earn-btn"
              aria-label="Earn"
              variant={compact ? 'text' : 'contained'}
              color={compact ? 'info' : 'background.paper'}
              size={compact ? 'small' : 'compact'}
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
