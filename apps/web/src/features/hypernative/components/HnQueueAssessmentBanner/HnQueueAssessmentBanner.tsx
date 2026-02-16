import { type ReactElement } from 'react'
import type { AlertProps } from '@mui/material'
import { Alert, Stack, Typography } from '@mui/material'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import ExternalLink from '@/components/common/ExternalLink'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import { useAssessmentUrl } from '../../hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from '../../hooks/useHnAssessmentSeverity'
import LockIcon from '@/public/images/common/lock-small.svg'
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

interface HnQueueAssessmentBannerProps {
  safeTxHash: string
  assessment: AsyncResult<ThreatAnalysisResults> | undefined
  isAuthenticated: boolean
}

const SEVERITY_MESSAGES: Record<Severity, string> = {
  [Severity.OK]: 'No issues found by Hypernative Guardian.',
  [Severity.INFO]: 'Info available from Hypernative Guardian.',
  [Severity.WARN]: 'Issues found by Hypernative Guardian.',
  [Severity.CRITICAL]: 'Transaction was blocked by Hypernative Guardian.',
  [Severity.ERROR]: 'Unable to fetch security scan result.',
}

const ALERT_SEVERITIES: Record<Severity, AlertProps['severity']> = {
  [Severity.OK]: 'success',
  [Severity.INFO]: 'info',
  [Severity.WARN]: 'warning',
  [Severity.CRITICAL]: 'error',
  [Severity.ERROR]: 'error',
}

export const HnQueueAssessmentBanner = ({
  safeTxHash,
  assessment,
  isAuthenticated,
}: HnQueueAssessmentBannerProps): ReactElement | null => {
  const { initiateLogin } = useHypernativeOAuth()
  const severity = useHnAssessmentSeverity(assessment)
  const assessmentUrl = useAssessmentUrl(safeTxHash)

  if (!isAuthenticated) {
    const handleLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      e.stopPropagation()
      trackEvent(HYPERNATIVE_EVENTS.HYPERNATIVE_LOGIN_CLICKED, {
        [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Queue,
      })
      initiateLogin()
    }

    return (
      <Alert severity="background" icon={<LockIcon />}>
        <Stack gap={1}>
          <Typography variant="body2" color="text.secondary">
            Log in to Hypernative to view security scan result.
          </Typography>
          <ExternalLink
            onClick={handleLogin}
            href="#"
            noIcon={false}
            sx={{
              textDecoration: 'underline',
              display: 'inline-flex',
              alignSelf: 'flex-start',
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Log in
            </Typography>
          </ExternalLink>
        </Stack>
      </Alert>
    )
  }

  if (!severity) {
    return null
  }

  const message = SEVERITY_MESSAGES[severity]
  const alertSeverity = ALERT_SEVERITIES[severity]

  return (
    <Alert severity={alertSeverity} icon={<SeverityIcon severity={severity} width={20} height={20} />}>
      <Stack gap={1}>
        <Typography variant="body2">{message}</Typography>
        <ExternalLink
          onClick={(e) => {
            e.stopPropagation()
            trackEvent(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
          }}
          href={assessmentUrl}
          sx={{
            textDecoration: 'underline',
            display: 'inline-flex',
            alignSelf: 'flex-start',
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            View details
          </Typography>
        </ExternalLink>
      </Stack>
    </Alert>
  )
}
