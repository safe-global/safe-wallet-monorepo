import Track from '@/components/common/Track'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import type { ReactElement, ReactNode } from 'react'
import { Countdown } from '@/components/common/Countdown'
import RecoveryPending from '@/public/images/common/recovery-pending.svg'
import type { ActionCardProps } from '@views/components/common/ActionCard/ActionCardView'
import ExternalLink from '@/components/common/ExternalLink'

import css from './styles.module.css'
import { HelpCenterArticle, HelperCenterArticleTitles } from '@safe-global/utils/config/constants'

export type RecoveryInProgressCardViewProps = {
  orientation: 'vertical' | 'horizontal'
  isExecutable: boolean
  isExpired: boolean
  remainingSeconds: number
  onClick: () => void
  renderActionCard: (props: ActionCardProps) => ReactNode
}

export function RecoveryInProgressCardView({
  orientation,
  isExecutable,
  isExpired,
  remainingSeconds,
  onClick,
  renderActionCard,
}: RecoveryInProgressCardViewProps): ReactElement {
  const icon = <RecoveryPending />
  const title = isExecutable
    ? 'Account can be recovered. '
    : isExpired
      ? 'Account recovery expired. '
      : 'Account recovery in progress. '
  const desc = isExecutable
    ? 'The review window has passed and it is now possible to execute the recovery proposal.'
    : isExpired
      ? 'The pending recovery proposal has expired and needs to be cancelled before a new one can be created.'
      : 'The recovery process has started. This Account will be ready to recover in:'

  if (orientation === 'horizontal') {
    return (
      <>
        {renderActionCard({
          severity: 'info',
          title,
          content: (
            <>
              {desc}
              {!isExecutable && !isExpired && (
                <>
                  {' '}
                  <Countdown seconds={remainingSeconds} />
                </>
              )}
            </>
          ),
          learnMore: {
            href: HelpCenterArticle.RECOVERY,
            trackingEvent: RECOVERY_EVENTS.LEARN_MORE,
            label: 'in-progress-card',
          },
          action: { label: 'Go to queue', onClick },
          trackingEvent: ATTENTION_PANEL_EVENTS.CHECK_RECOVERY_PROPOSAL,
          testId: 'recovery-in-progress-card',
        })}
      </>
    )
  }

  return (
    // eslint-disable-next-line no-restricted-syntax -- gap-8 spaces the recovery card sections; css.card owns padding/margin, radius comes from the Card default (lg)
    <Card className={[css.card, 'flex flex-col gap-8'].join(' ')}>
      <div className="flex justify-between">
        {icon}

        <Track {...RECOVERY_EVENTS.LEARN_MORE} label="in-progress-card">
          <ExternalLink href={HelpCenterArticle.RECOVERY} title={HelperCenterArticleTitles.RECOVERY}>
            Learn more
          </ExternalLink>
        </Track>
      </div>

      <div>
        <Typography variant="h4" className="mb-4">
          {title}
        </Typography>

        <Typography className="mb-4">{desc}</Typography>

        <Countdown seconds={remainingSeconds} />
      </div>

      <Separator className="mx-[calc(-1*var(--space-4))]" />

      <Track {...RECOVERY_EVENTS.CHECK_RECOVERY_PROPOSAL}>
        <Button data-testid="queue-btn" variant="default" onClick={onClick} className="self-end">
          Go to queue
        </Button>
      </Track>
    </Card>
  )
}
