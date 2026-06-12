import type { ReactElement, ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/notifications/error.svg'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import Track from '@/components/common/Track'
import ExternalLink from '@/components/common/ExternalLink'

export type ActionCardSeverity = 'info' | 'warning' | 'critical'

export interface ActionCardButton {
  label: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
}

export interface LearnMoreLink {
  href: string
  label?: string
  trackingEvent?: AnalyticsEvent
}

export interface ActionCardProps {
  severity: ActionCardSeverity
  title: string
  content?: ReactNode
  action?: ActionCardButton
  learnMore?: LearnMoreLink
  trackingEvent?: AnalyticsEvent
  testId?: string
  /** Optional data-testid for the action button/link for Cypress and testing */
  actionTestId?: string
}

const ACTION_BUTTON_CLASSNAME =
  'mt-2 -ml-2 min-w-0 cursor-pointer p-2 normal-case no-underline hover:bg-transparent hover:underline'

const severityConfig = {
  info: {
    backgroundColor: 'var(--color-info-background)',
    borderColor: 'var(--color-info-main)',
    iconColor: 'var(--color-info-main)',
    icon: InfoIcon,
  },
  warning: {
    backgroundColor: 'var(--color-warning-background)',
    borderColor: 'var(--color-warning-main)',
    iconColor: 'var(--color-warning-main)',
    icon: WarningIcon,
  },
  critical: {
    backgroundColor: 'var(--color-error-background)',
    borderColor: 'var(--color-error-dark)',
    iconColor: 'var(--color-error-dark)',
    icon: ErrorIcon,
  },
} as const

const DEFAULT_LEARN_MORE_EVENT: AnalyticsEvent = {
  action: 'Learn more click',
  category: 'action_card',
}

const ActionButton = ({
  action,
  trackingEvent,
  testId = 'action-card-button',
}: {
  action: ActionCardButton
  trackingEvent?: AnalyticsEvent
  testId?: string
}): ReactElement => {
  const label = (
    <>
      {action.label}
      <ChevronRight />
    </>
  )

  if (action.href) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={ACTION_BUTTON_CLASSNAME}
        data-testid={testId}
        render={<a href={action.href} target={action.target} rel={action.rel} />}
        onClick={trackingEvent ? () => trackEvent(trackingEvent) : undefined}
      >
        {label}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={ACTION_BUTTON_CLASSNAME}
      data-testid={testId}
      onClick={() => {
        if (trackingEvent) {
          trackEvent(trackingEvent)
        }
        action.onClick?.()
      }}
    >
      {label}
    </Button>
  )
}

export const ActionCard = ({
  severity,
  title,
  content,
  action,
  learnMore,
  trackingEvent,
  testId = 'action-card',
  actionTestId,
}: ActionCardProps): ReactElement => {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-3 rounded-lg p-4"
      style={{ backgroundColor: config.backgroundColor }}
    >
      {/* Header: Icon + Title + Content */}
      <div className="flex items-start gap-[6.8px]">
        <Icon className="size-5 shrink-0" style={{ color: config.iconColor }} />

        <Typography variant="paragraph-small" className="flex-1 leading-normal">
          <span className="font-bold">{title}</span>
          {content && <> {content}</>}
          {learnMore && (
            <>
              {' '}
              <Track {...(learnMore.trackingEvent || DEFAULT_LEARN_MORE_EVENT)} label={learnMore.label || 'learn-more'}>
                <ExternalLink href={learnMore.href} noIcon className="font-normal underline [&_span]:underline">
                  Learn more
                </ExternalLink>
              </Track>
            </>
          )}
        </Typography>
      </div>

      {/* Action */}
      {action && (
        <div className="pl-[26.8px]">
          <ActionButton action={action} trackingEvent={trackingEvent} testId={actionTestId} />
        </div>
      )}
    </div>
  )
}
