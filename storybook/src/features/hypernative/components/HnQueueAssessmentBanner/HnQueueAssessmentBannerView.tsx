import { type MouseEvent, type ReactElement } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import ExternalLink from '@/components/common/ExternalLink'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import LockIcon from '@/public/images/common/lock-small.svg'
// eslint-disable-next-line no-restricted-imports -- routing SeverityIcon through the safe-shield barrel closes a hypernative<->safe-shield module-init cycle (TDZ)
import { SeverityIcon } from '@/features/safe-shield/components/SeverityIcon'

type AlertVariant = 'default' | 'warning' | 'destructive'

export type HnQueueAssessmentBannerViewProps = {
  isAuthenticated: boolean
  severity?: Severity
  assessmentUrl: string
  onLogin: (e: MouseEvent<HTMLAnchorElement>) => void
  onViewDetails: (e: MouseEvent<HTMLAnchorElement>) => void
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

export const HnQueueAssessmentBannerView = ({
  isAuthenticated,
  severity,
  assessmentUrl,
  onLogin,
  onViewDetails,
}: HnQueueAssessmentBannerViewProps): ReactElement | null => {
  if (!isAuthenticated) {
    return (
      <Alert variant="subtle">
        <LockIcon />
        <AlertDescription>
          <div className="flex flex-col gap-2">
            <Typography variant="paragraph-small">Log in to Hypernative to view security scan result.</Typography>
            <ExternalLink
              onClick={onLogin}
              href="#"
              noIcon={false}
              className="inline-flex self-start hover:text-[var(--color-primary-light)]!"
            >
              Log in
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
    <Alert variant={alertVariant} outlined={alertVariant !== 'warning'}>
      <SeverityIcon severity={severity} width={20} height={20} />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <Typography variant="paragraph-small">{message}</Typography>
          <ExternalLink onClick={onViewDetails} href={assessmentUrl} className="inline-flex self-start">
            <Typography variant="paragraph-small-bold">View details</Typography>
          </ExternalLink>
        </div>
      </AlertDescription>
    </Alert>
  )
}
