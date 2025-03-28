import { SvgIcon, Tooltip, Typography } from '@mui/material'
import InfoIcon from '@/public/images/notifications/info.svg'
import { MAX_DAY_RELAYS } from '@/hooks/useRemainingRelays'
import css from '../BalanceInfo/styles.module.css'
import type { RelayCountResponse } from '@safe-global/safe-gateway-typescript-sdk'
import { maybePlural } from '@safe-global/utils/utils/formatters'

const RemainingRelays = ({ relays, tooltip }: { relays?: RelayCountResponse; tooltip?: string }) => {
  if (!tooltip) {
    const limit = relays?.limit ?? MAX_DAY_RELAYS
    tooltip = `${limit} transaction${maybePlural(limit)} per day for free`
  }

  return (
    <div className={css.container}>
      <Typography variant="body2" color="primary.light" display="flex" alignItems="center" gap={0.5}>
        <b>{relays?.remaining ?? MAX_DAY_RELAYS}</b> free transactions left today
        <Tooltip title={tooltip} placement="top" arrow>
          <span style={{ lineHeight: 0 }}>
            <SvgIcon component={InfoIcon} inheritViewBox color="info" fontSize="small" sx={{ color: '#B2B5B2' }} />
          </span>
        </Tooltip>
      </Typography>
    </div>
  )
}

export default RemainingRelays
