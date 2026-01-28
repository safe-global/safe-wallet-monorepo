import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import { Button, Card, Divider, Grid, Typography } from '@mui/material'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import { ActionCard } from '@/components/common/ActionCard'
import { RecoverAccountFlow } from '@/components/tx-flow/flows'
import useSafeInfo from '@/hooks/useSafeInfo'
import madProps from '@/utils/mad-props'
import { TxModalContext } from '@/components/tx-flow'
import type { TxModalContextType } from '@/components/tx-flow'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

import css from './styles.module.css'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

type Props =
  | {
      orientation?: 'vertical'
      onClose: () => void
      safe: SafeState
      setTxFlow: TxModalContextType['setTxFlow']
    }
  | {
      orientation: 'horizontal'
      onClose?: never
      safe: SafeState
      setTxFlow: TxModalContextType['setTxFlow']
    }

export function InternalRecoveryProposalCard({
  orientation = 'vertical',
  onClose,
  safe,
  setTxFlow,
}: Props): ReactElement {
  const isDarkMode = useDarkMode()

  const onRecover = async () => {
    onClose?.()
    setTxFlow(<RecoverAccountFlow />)
    // Only track for vertical orientation; horizontal ActionCard handles its own tracking
    if (orientation === 'vertical') {
      trackEvent({ ...ATTENTION_PANEL_EVENTS.START_RECOVERY, label: 'pop-up' })
    }
  }

  const icon = (
    <img
      src={`/images/common/propose-recovery-${isDarkMode ? 'dark' : 'light'}.svg`}
      alt="An arrow surrounding a circle containing a vault"
    />
  )
  const title = 'Recover this account. '
  const desc = 'Your connected wallet can help you regain access by adding a new signer.'

  const link = (
    <Track {...RECOVERY_EVENTS.LEARN_MORE} label="proposal-card">
      <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
        Learn more
      </ExternalLink>
    </Track>
  )

  const recoveryButton = (
    <Button data-testid="start-recovery-btn" variant="contained" onClick={onRecover} className={css.button}>
      Start recovery
    </Button>
  )

  if (orientation === 'horizontal') {
    return (
      <ActionCard
        severity="info"
        title={title}
        content={desc}
        action={{ label: 'Start recovery', onClick: onRecover }}
        trackingEvent={ATTENTION_PANEL_EVENTS.START_RECOVERY}
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
const InternalUseSafe = () => useSafeInfo().safe
const InternalUseSetTxFlow = () => useContext(TxModalContext).setTxFlow

export const RecoveryProposalCard = madProps(InternalRecoveryProposalCard, {
  safe: InternalUseSafe,
  setTxFlow: InternalUseSetTxFlow,
})
