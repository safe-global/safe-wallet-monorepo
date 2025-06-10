import CheckWallet from '@/components/common/CheckWallet'
import Track from '@/components/common/Track'
import { AppRoutes } from '@/config/routes'
import useSpendingLimit from '@/hooks/useSpendingLimit'
import { Button } from '@mui/material'
import type { TokenInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useRouter } from 'next/router'
import type { ReactElement } from 'react'
import EarnIcon from '@/public/images/common/earn.svg'
import { EARN_EVENTS, type EARN_LABELS } from '@/services/analytics/events/earn'
import { useCurrentChain } from '@/hooks/useChains'
import css from './styles.module.css'
import classnames from 'classnames'

const EarnButton = ({
  tokenInfo,
  trackingLabel,
  compact = true,
}: {
  tokenInfo: TokenInfo
  trackingLabel: EARN_LABELS
  compact?: boolean
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
        <Track {...EARN_EVENTS.OPEN_EARN_PAGE} label={trackingLabel}>
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
        </Track>
      )}
    </CheckWallet>
  )
}

export default EarnButton
