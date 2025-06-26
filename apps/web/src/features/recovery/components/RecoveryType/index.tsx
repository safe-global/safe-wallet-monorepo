import { Box, SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import RecoveryPlusIcon from '@/public/images/common/recovery-plus.svg'
import txTypeCss from '@/components/transactions/TxType/styles.module.css'
import pendingTxCss from '@/components/dashboard/PendingTxs/styles.module.css'
import { DateTime } from '@/components/common/DateTime/DateTime'

export function RecoveryType({
  isMalicious,
  date,
  isDashboard = false,
}: {
  isMalicious: boolean
  date?: bigint
  isDashboard?: boolean
}): ReactElement {
  return (
    <Box className={txTypeCss.txType} gap={isDashboard ? '12px !important' : 1}>
      <Box className={isDashboard ? pendingTxCss.iconWrapper : undefined}>
        <SvgIcon
          component={RecoveryPlusIcon}
          inheritViewBox
          fontSize="inherit"
          sx={{ '& path': { fill: ({ palette }) => palette.warning.main } }}
        />
      </Box>
      <Box>
        <Typography color={isMalicious ? 'error.main' : undefined}>
          {isMalicious ? 'Malicious transaction' : 'Account recovery'}
        </Typography>

        {date && (
          <Typography variant="body2" color="primary.light">
            <DateTime value={Number(date)} showDateTime={false} showTime={false} />
          </Typography>
        )}
      </Box>
    </Box>
  )
}
