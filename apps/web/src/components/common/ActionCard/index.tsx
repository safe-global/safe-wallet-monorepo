import type { ReactElement, ReactNode } from 'react'
import { Box, Button, Paper, SvgIcon, Typography } from '@mui/material'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
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
}

const ACTION_BUTTON_SX = {
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
} as const

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
}: {
  action: ActionCardButton
  trackingEvent?: AnalyticsEvent
}): ReactElement => {
  if (action.href) {
    return (
      <Button
        variant="text"
        size="small"
        component="a"
        href={action.href}
        target={action.target}
        rel={action.rel}
        endIcon={<KeyboardArrowRightRoundedIcon />}
        sx={ACTION_BUTTON_SX}
        onClick={trackingEvent ? () => trackEvent(trackingEvent) : undefined}
      >
        {action.label}
      </Button>
    )
  }

  return (
    <Button
      variant="text"
      size="small"
      endIcon={<KeyboardArrowRightRoundedIcon />}
      sx={ACTION_BUTTON_SX}
      onClick={() => {
        if (trackingEvent) {
          trackEvent(trackingEvent)
        }
        action.onClick?.()
      }}
    >
      {action.label}
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
}: ActionCardProps): ReactElement => {
  const config = severityConfig[severity]

  return (
    <Paper
      data-testid={testId}
      elevation={0}
      sx={{
        backgroundColor: config.backgroundColor,
        borderRadius: 1,
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Header: Icon + Title + Content */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.85 }}>
        <SvgIcon
          component={config.icon}
          inheritViewBox
          sx={{ color: config.iconColor, flexShrink: 0, width: 20, height: 20 }}
        />

        <Typography variant="subtitle2" sx={{ flex: 1, lineHeight: 1.5 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>
            {title}
          </Box>
          {content && <> {content}</>}
          {learnMore && (
            <>
              {' '}
              <Track {...(learnMore.trackingEvent || DEFAULT_LEARN_MORE_EVENT)} label={learnMore.label || 'learn-more'}>
                <ExternalLink
                  href={learnMore.href}
                  noIcon
                  sx={{
                    fontWeight: 400,
                    textDecoration: 'underline',
                    '& span': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Learn more
                </ExternalLink>
              </Track>
            </>
          )}
        </Typography>
      </Box>

      {/* Action */}
      {action && (
        <Box sx={{ paddingLeft: 'calc(20px + 0.85 * 8px)' }}>
          <ActionButton action={action} trackingEvent={trackingEvent} />
        </Box>
      )}
    </Paper>
  )
}
