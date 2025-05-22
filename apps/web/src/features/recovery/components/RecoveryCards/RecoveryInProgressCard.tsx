import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button, Card, Divider, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/dist/client/router'
import type { ReactElement } from 'react'

import { useRecoveryTxState } from '@/features/recovery/hooks/useRecoveryTxState'
import { Countdown } from '@/components/common/Countdown'
import RecoveryPending from '@/public/images/common/recovery-pending.svg'
import ExternalLink from '@/components/common/ExternalLink'
import { AppRoutes } from '@/config/routes'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

import css from './styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

type Props =
  | {
      orientation?: 'vertical'
      onClose: () => void
      recovery: RecoveryQueueItem
    }
  | {
      orientation: 'horizontal'
      onClose?: never
      recovery: RecoveryQueueItem
    }

export function RecoveryInProgressCard({ orientation = 'vertical', onClose, recovery }: Props): ReactElement {
  const { isExecutable, isExpired, remainingSeconds } = useRecoveryTxState(recovery)
  const router = useRouter()

  const onClick = async () => {
    await router.push({
      pathname: AppRoutes.transactions.queue,
      query: router.query,
    })
    onClose?.()
  }

  const icon = <RecoveryPending />
  const title = isExecutable
    ? 'Account can be recovered'
    : isExpired
      ? 'Account recovery expired'
      : 'Account recovery in progress'
  const desc = isExecutable
    ? 'The review window has passed and it is now possible to execute the recovery proposal.'
    : isExpired
      ? 'The pending recovery proposal has expired and needs to be cancelled before a new one can be created.'
      : 'The recovery process has started. This Account will be ready to recover in:'

  const link = (
    <Track {...RECOVERY_EVENTS.LEARN_MORE} label="in-progress-card">
      <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
        Learn more
      </ExternalLink>
    </Track>
  )

  if (orientation === 'horizontal') {
    return (
      <Card sx={{ py: 3, px: 4 }}>
        <Grid
          container
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Grid item>{icon}</Grid>

          <Grid item xs>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                color: 'primary.light',
                mb: 1,
              }}
            >
              {desc}
            </Typography>

            <Countdown seconds={remainingSeconds} />
          </Grid>

          <Grid item>{link}</Grid>
        </Grid>
      </Card>
    )
  }

  return (
    <Card elevation={0} className={css.card}>
      <Grid
        container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Grid
          item
          xs={12}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {icon}

          {link}
        </Grid>

        <Grid item xs={12}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mb: 2,
            }}
          >
            {desc}
          </Typography>

          <Countdown seconds={remainingSeconds} />
        </Grid>

        <Divider flexItem sx={{ mx: -4 }} />

        <Track {...RECOVERY_EVENTS.CHECK_RECOVERY_PROPOSAL}>
          <Button data-testid="queue-btn" variant="contained" onClick={onClick} sx={{ alignSelf: 'flex-end' }}>
            Go to queue
          </Button>
        </Track>
      </Grid>
    </Card>
  )
}
