import Track from '@/components/common/Track'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
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
    <Button data-testid="start-recovery" variant="default" onClick={handleRecoverWithTracking} className={css.button}>
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
        actionTestId="start-recovery"
      />
    )
  }

  return (
    <div
      data-testid="recovery-proposal"
      className={[css.card, 'flex flex-col gap-8 rounded-lg bg-[var(--color-background-paper)]'].join(' ')}
    >
      <div className="flex justify-between">
        {icon}

        <Track {...RECOVERY_EVENTS.LEARN_MORE} label="proposal-card">
          <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
            Learn more
          </ExternalLink>
        </Track>
      </div>

      <div>
        <Typography variant="h4" className="mb-4">
          {title}
        </Typography>

        <Typography className="mb-4 text-[var(--color-primary-light)]">{desc}</Typography>
      </div>

      <Separator className="mx-[calc(-1*var(--space-4))]" />

      <div className="flex justify-end gap-0 md:gap-2">
        <Button
          variant="ghost"
          data-testid="postpone-recovery-btn"
          onClick={() => {
            trackEvent(RECOVERY_EVENTS.DISMISS_PROPOSAL_CARD)
            onClose?.()
          }}
        >
          I&apos;ll do it later
        </Button>
        {recoveryButton}
      </div>
    </div>
  )
}

// Appease TypeScript
const InternalUseSetTxFlow = () => useContext(TxModalContext).setTxFlow

export const RecoveryProposalCard = madProps(InternalRecoveryProposalCard, {
  setTxFlow: InternalUseSetTxFlow,
})
