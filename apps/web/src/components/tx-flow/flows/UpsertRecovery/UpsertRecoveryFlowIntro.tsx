import { Button, CardActions, Divider, Grid, Typography } from '@mui/material'
import type { ReactElement } from 'react'

import TxCard from '../../common/TxCard'
import RecoveryRecoverers from '@/public/images/settings/spending-limit/beneficiary.svg'
import RecoveryRecoverer from '@/public/images/transactions/recovery-recoverer.svg'
import RecoveryDelay from '@/public/images/settings/spending-limit/time.svg'
import RecoveryExecution from '@/public/images/transactions/recovery-execution.svg'

import css from './styles.module.css'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { useContext } from 'react'
import { TxFlowContext } from '../../TxFlowProvider'

const RecoverySteps = [
  {
    Icon: RecoveryRecoverers,
    title: 'Choose a Recoverer and set a review window',
    subtitle:
      'Only your chosen Recoverer can initiate the recovery process. The process can be cancelled at any time during the review window.',
  },
  {
    Icon: RecoveryRecoverer,
    title: 'Lost access? Let the Recoverer connect',
    subtitle: 'The recovery process can be initiated by a trusted Recoverer when connected to your Safe Account.',
  },
  {
    Icon: RecoveryDelay,
    title: 'Start the recovery process',
    subtitle: 'Your Recoverer initiates the recovery process by proposing a new Safe Account setup on-chain.',
  },
  {
    Icon: RecoveryExecution,
    title: 'All done! The Account is yours again',
    subtitle:
      'Once the review window has passed, you can execute the recovery proposal and regain access to your Safe Account.',
  },
]

export function UpsertRecoveryFlowIntro(): ReactElement {
  const { onNext } = useContext(TxFlowContext)
  return (
    <TxCard>
      <Grid
        container
        className={css.connector}
        sx={{
          display: 'flex',
          gap: 4,
        }}
      >
        {RecoverySteps.map(({ Icon, title, subtitle }, index) => (
          <Grid item xs={12} key={index}>
            <Grid
              container
              sx={{
                display: 'flex',
                gap: 3,
              }}
            >
              <Grid item className={css.icon}>
                <Icon />
              </Grid>
              <Grid item xs>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 0.5,
                  }}
                >
                  {title}
                </Typography>
                <Typography variant="body2">{subtitle}</Typography>
              </Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>
      <Divider className={commonCss.nestedDivider} />
      <CardActions sx={{ mt: 'var(--space-1) !important' }}>
        <Button data-testid="next-btn" variant="contained" onClick={onNext}>
          Next
        </Button>
      </CardActions>
    </TxCard>
  )
}
