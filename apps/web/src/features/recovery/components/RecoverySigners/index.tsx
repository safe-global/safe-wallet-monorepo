import { Box, List, ListItem, ListItemIcon, ListItemText, SvgIcon, Typography } from '@mui/material'
import type { ReactElement } from 'react'

import CircleIcon from '@/public/images/common/circle.svg'
import CheckIcon from '@/public/images/common/circle-check.svg'
import EthHashInfo from '@/components/common/EthHashInfo'
import { Countdown } from '@/components/common/Countdown'
import { ExecuteRecoveryButton } from '../ExecuteRecoveryButton'
import { CancelRecoveryButton } from '../CancelRecoveryButton'
import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import { formatDateTime } from '@safe-global/utils/utils/date'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

import txSignersCss from '@/components/transactions/TxSigners/styles.module.css'

export function RecoverySigners({ item }: { item: RecoveryQueueItem }): ReactElement {
  const { isExecutable, isExpired, isNext, remainingSeconds } = useRecoveryTxState(item)

  const desc = isExecutable ? (
    item.expiresAt !== null ? (
      <>
        The recovery proposal can be executed{' '}
        <Typography
          sx={{
            color: 'primary.main',
          }}
        >
          until {formatDateTime(Number(item.expiresAt))}.
        </Typography>
      </>
    ) : (
      'The recovery proposal can be executed now.'
    )
  ) : isExpired ? (
    'The recovery proposal has expired and needs to be cancelled before a new one can be created.'
  ) : (
    'The recovery proposal can be executed after the review window has passed:'
  )

  return (
    <>
      <List className={txSignersCss.signers}>
        <ListItem>
          <ListItemIcon>
            <SvgIcon
              component={CheckIcon}
              inheritViewBox
              className={txSignersCss.icon}
              sx={{
                '& path:last-of-type': { fill: ({ palette }) => palette.background.paper },
              }}
            />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>Created</ListItemText>
        </ListItem>
        <ListItem sx={{ py: 0, pb: 1, ml: 4 }}>
          <EthHashInfo address={item.executor} hasExplorer showCopyButton />
        </ListItem>
        <ListItem sx={{ py: 0 }}>
          <ListItemIcon>
            <SvgIcon
              component={CircleIcon}
              inheritViewBox
              className={txSignersCss.icon}
              sx={{ color: ({ palette }) => palette.border.main }}
            />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>Can be executed</ListItemText>
        </ListItem>
      </List>
      <Box className={txSignersCss.listFooter}>
        <Typography sx={({ palette }) => ({ color: palette.border.main, mb: 1 })}>{desc}</Typography>

        {isNext && <Countdown seconds={remainingSeconds} />}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          mt: 2,
        }}
      >
        <ExecuteRecoveryButton recovery={item} />
        <CancelRecoveryButton recovery={item} />
      </Box>
    </>
  )
}
