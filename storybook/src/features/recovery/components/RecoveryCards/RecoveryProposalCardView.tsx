import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import type { ActionCardProps } from '@views/components/common/ActionCard/ActionCardView'

import css from './styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

export type RecoveryProposalCardViewProps = {
  orientation: 'vertical' | 'horizontal'
  isDarkMode: boolean
  onRecover: () => void
  onRecoverWithTracking: () => void
  onPostpone: () => void
  renderActionCard: (props: ActionCardProps) => ReactNode
}

export function RecoveryProposalCardView({
  orientation,
  isDarkMode,
  onRecover,
  onRecoverWithTracking,
  onPostpone,
  renderActionCard,
}: RecoveryProposalCardViewProps): ReactElement {
  const icon = (
    <img
      src={`/images/common/propose-recovery-${isDarkMode ? 'dark' : 'light'}.svg`}
      alt="An arrow surrounding a circle containing a vault"
    />
  )
  const title = 'Recover this account. '
  const desc = 'Your connected wallet can help you regain access by adding a new signer.'

  const recoveryButton = (
    <Button data-testid="start-recovery" variant="default" onClick={onRecoverWithTracking} className={css.button}>
      Start recovery
    </Button>
  )

  if (orientation === 'horizontal') {
    return (
      <>
        {renderActionCard({
          severity: 'info',
          title,
          content: desc,
          learnMore: {
            href: HelpCenterArticle.RECOVERY,
            trackingEvent: RECOVERY_EVENTS.LEARN_MORE,
            label: 'proposal-card',
          },
          action: { label: 'Start recovery', onClick: onRecover },
          trackingEvent: RECOVERY_EVENTS.START_RECOVERY,
          testId: 'recovery-proposal-card',
          actionTestId: 'start-recovery',
        })}
      </>
    )
  }

  return (
    // eslint-disable-next-line no-restricted-syntax -- gap-8 spaces the recovery card sections; css.card owns padding/margin, radius comes from the Card default (lg)
    <Card data-testid="recovery-proposal" className={[css.card, 'flex flex-col gap-8'].join(' ')}>
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
        <Button variant="ghost" data-testid="postpone-recovery-btn" onClick={onPostpone}>
          I&apos;ll do it later
        </Button>
        {recoveryButton}
      </div>
    </Card>
  )
}
