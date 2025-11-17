import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import { Button, SvgIcon, Typography, Box } from '@mui/material'
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
const StakeButton = ({
  tokenInfo,
  trackingLabel,
  compact = true,
  plain = false,
}: {
  tokenInfo: Balance['tokenInfo']
  trackingLabel: STAKE_LABELS
  compact?: boolean
  plain?: boolean
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
          {plain ? (
            <Box
              component="span"
              className={classnames(css.plainButton, { [css.plainButtonDisabled]: !isOk })}
              data-testid="stake-btn"
              onClick={isOk ? handleClick : undefined}
              aria-label="Stake"
              aria-disabled={!isOk}
            >
              <SvgIcon component={StakeIcon} inheritViewBox className={css.plainIcon} />
              <Typography component="span" variant="body2">
                Stake
              </Typography>
            </Box>
          ) : (
            <Button
              className={classnames({ [css.button]: compact, [css.buttonDisabled]: !isOk })}
              data-testid="stake-btn"
              aria-label="Stake"
              variant={compact ? 'text' : 'contained'}
              color={compact ? 'info' : 'background.paper'}
              size={compact ? 'small' : 'compact'}
              disableElevation
              startIcon={<StakeIcon />}
              onClick={handleClick}
              disabled={!isOk}
            >
              Stake
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default StakeButton
