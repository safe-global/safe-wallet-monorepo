import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button, Card, Divider, Grid, Typography } from '@mui/material'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import { useContext } from 'react'
import type { ReactElement } from 'react'

import { useDarkMode } from '@/hooks/useDarkMode'
import ExternalLink from '@/components/common/ExternalLink'
import ErrorMessage from '@/components/tx/ErrorMessage'
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
    trackEvent({ ...RECOVERY_EVENTS.START_RECOVERY, label: orientation === 'vertical' ? 'pop-up' : 'dashboard' })
  }

  const icon = (
    <img
      src={`/images/common/propose-recovery-${isDarkMode ? 'dark' : 'light'}.svg`}
      alt="An arrow surrounding a circle containing a vault"
    />
  )
  const title = 'Recover this Account'
  const desc = `The connected wallet was chosen as a trusted Recoverer. You can help the owner${maybePlural(
    safe.owners,
  )} regain access by resetting the Account setup.`

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
      <ErrorMessage level="info" title={title}>
        <Typography>{desc}</Typography>
        <Button
          data-testid="start-recovery-btn"
          variant="text"
          size="small"
          endIcon={<KeyboardArrowRightRoundedIcon />}
          onClick={onRecover}
          sx={{
            mt: 1,
            ml: -1,
            p: 1,
            minWidth: 'auto',
            textTransform: 'none',
            textDecoration: 'none !important',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline !important',
              backgroundColor: 'transparent',
            },
          }}
        >
          Start recovery
        </Button>
      </ErrorMessage>
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
