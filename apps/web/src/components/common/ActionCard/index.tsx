import type { ReactElement, ReactNode } from 'react'
import { Box, Button, Paper, SvgIcon, Typography } from '@mui/material'
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded'
import WarningIcon from '@/public/images/notifications/warning.svg'
import InfoIcon from '@/public/images/notifications/info.svg'
import ErrorIcon from '@/public/images/notifications/error.svg'
import { trackEvent } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'

export type ActionCardSeverity = 'info' | 'warning' | 'critical'

export interface ActionCardButton {
  label: string
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
}

export interface ActionCardProps {
  severity: ActionCardSeverity
  title: string
  content?: ReactNode
  action?: ActionCardButton
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

export const ActionCard = ({
  severity,
  title,
  content,
  action,
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
      {/* Header: Icon + Title */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.85 }}>
        <SvgIcon
          component={config.icon}
          inheritViewBox
          sx={{ color: config.iconColor, flexShrink: 0, width: 20, height: 20 }}
        />

        <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 700, lineHeight: 1.5 }}>
          {title}
        </Typography>
      </Box>

      {/* Content */}
      {content && (
        <Box sx={{ paddingLeft: '28px' }}>
          {typeof content === 'string' ? <Typography variant="body2">{content}</Typography> : content}
        </Box>
      )}

      {/* Action */}
      {action && (
        <Box sx={{ paddingLeft: '28px' }}>
          <Button
            variant="text"
            size="small"
            endIcon={<KeyboardArrowRightRoundedIcon />}
            sx={ACTION_BUTTON_SX}
            {...(action.href
              ? {
                  href: action.href,
                  target: action.target,
                  rel: action.rel,
                  component: 'a' as const,
                  onClick: trackingEvent ? () => trackEvent(trackingEvent) : undefined,
                }
              : {
                  onClick: () => {
                    if (trackingEvent) {
                      trackEvent(trackingEvent)
                    }
                    action.onClick?.()
                  },
                })}
          >
            {action.label}
          </Button>
        </Box>
      )}
    </Paper>
  )
}
