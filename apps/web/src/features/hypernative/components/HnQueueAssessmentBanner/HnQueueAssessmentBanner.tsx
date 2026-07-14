import { type ReactElement } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import ExternalLink from '@/components/common/ExternalLink'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useHypernativeOAuth } from '../../hooks/useHypernativeOAuth'
import { useAssessmentUrl } from '../../hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from '../../hooks/useHnAssessmentSeverity'
import LockIcon from '@/public/images/common/lock-small.svg'
// eslint-disable-next-line no-restricted-imports -- routing SeverityIcon through the safe-shield barrel closes a hypernative<->safe-shield module-init cycle (TDZ)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'
import { trackEvent, HYPERNATIVE_EVENTS } from '@/services/analytics'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

type AlertVariant = 'default' | 'warning' | 'destructive'

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

const ALERT_SEVERITIES: Record<Severity, AlertVariant> = {
  [Severity.OK]: 'default',
  [Severity.INFO]: 'default',
  [Severity.WARN]: 'warning',
  [Severity.CRITICAL]: 'destructive',
  [Severity.ERROR]: 'destructive',
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
      <Alert variant="default">
        <LockIcon />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
              Log in to Hypernative to view security scan result.
            </Typography>
            <ExternalLink onClick={handleLogin} href="#" noIcon={false} className="inline-flex self-start underline">
              <Typography variant="paragraph-small-bold">Log in</Typography>
            </ExternalLink>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!severity) {
    return null
  }

  const message = SEVERITY_MESSAGES[severity]
  const alertVariant = ALERT_SEVERITIES[severity]

  return (
    <Alert variant={alertVariant}>
      <SeverityIcon severity={severity} width={20} height={20} />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <Typography variant="paragraph-small">{message}</Typography>
          <ExternalLink
            onClick={(e) => {
              e.stopPropagation()
              trackEvent(HYPERNATIVE_EVENTS.SECURITY_REPORT_CLICKED)
            }}
            href={assessmentUrl}
            className="inline-flex self-start underline"
          >
            <Typography variant="paragraph-small-bold">View details</Typography>
          </ExternalLink>
        </div>
      </AlertDescription>
    </Alert>
  )
}
