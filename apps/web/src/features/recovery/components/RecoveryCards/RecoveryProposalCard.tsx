import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button, Card, Divider, Grid, Typography } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { ActionCard } from '@/components/common/ActionCard'
import { RecoverAccountFlow } from '@/components/tx-flow/flows'
import madProps from '@/utils/mad-props'
import { TxModalContext } from '@/components/tx-flow'
import type { TxModalContextType } from '@/components/tx-flow'

import css from './styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

type Props =
  | {
      orientation?: 'vertical'
      onClose: () => void
      setTxFlow: TxModalContextType['setTxFlow']
    }
  | {
      orientation: 'horizontal'
      onClose?: never
      setTxFlow: TxModalContextType['setTxFlow']
    }

export function InternalRecoveryProposalCard({ orientation = 'vertical', onClose, setTxFlow }: Props): ReactElement {
  const isDarkMode = useDarkMode()

  const handleRecover = () => {
    onClose?.()
    setTxFlow(<RecoverAccountFlow />)
  }

  const handleRecoverWithTracking = () => {
    trackEvent(RECOVERY_EVENTS.START_RECOVERY)
    handleRecover()
  }

  const icon = (
    <img
      src={`/images/common/propose-recovery-${isDarkMode ? 'dark' : 'light'}.svg`}
      alt="An arrow surrounding a circle containing a vault"
    />
  )
  const title = 'Recover this account. '
  const desc = 'Your connected wallet can help you regain access by adding a new signer.'

  const recoveryButton = (
    <Button
      data-testid="start-recovery-btn"
      variant="contained"
      onClick={handleRecoverWithTracking}
      className={css.button}
    >
      Start recovery
    </Button>
  )

  if (orientation === 'horizontal') {
    return (
      <ActionCard
        severity="info"
        title={title}
        content={desc}
        learnMore={{
          href: HelpCenterArticle.RECOVERY,
          trackingEvent: RECOVERY_EVENTS.LEARN_MORE,
          label: 'proposal-card',
        }}
        action={{ label: 'Start recovery', onClick: handleRecover }}
        trackingEvent={RECOVERY_EVENTS.START_RECOVERY}
        testId="recovery-proposal-card"
      />
    )
  }

  return (
    <Card data-testid="recovery-proposal" elevation={0} className={css.card}>
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

          <Track {...RECOVERY_EVENTS.LEARN_MORE} label="proposal-card">
            <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
              Learn more
            </ExternalLink>
          </Track>
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
              color: 'primary.light',
              mb: 2,
            }}
          >
            {desc}
          </Typography>
        </Grid>

        <Divider flexItem sx={{ mx: -4 }} />

        <Grid
          item
          container
          sx={{
            justifyContent: 'flex-end',
            gap: { md: 1 },
          }}
        >
          <Button
            data-testid="postpone-recovery-btn"
            onClick={() => {
              trackEvent(RECOVERY_EVENTS.DISMISS_PROPOSAL_CARD)
              onClose?.()
            }}
          >
            I&apos;ll do it later
          </Button>
          {recoveryButton}
        </Grid>
      </Grid>
    </Card>
  )
}

// Appease TypeScript
const InternalUseSetTxFlow = () => useContext(TxModalContext).setTxFlow

export const RecoveryProposalCard = madProps(InternalRecoveryProposalCard, {
  setTxFlow: InternalUseSetTxFlow,
})
