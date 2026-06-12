import { type ReactElement } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { SeverityIcon as SeverityIconSafeShield } from '@/features/safe-shield/components/SeverityIcon'
import ExternalLink from '@/components/common/ExternalLink'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import BlockIcon from '@/public/images/common/block2.svg'
import LockIcon from '@/public/images/common/lock-small.svg'
import HypernativeIcon from '@/public/images/hypernative/hypernative-icon.svg'
import { useAssessmentUrl } from '../../hooks/useAssessmentUrl'
import { useHnAssessmentSeverity } from '../../hooks/useHnAssessmentSeverity'

interface HnQueueAssessmentProps {
  safeTxHash: string
  assessment: AsyncResult<ThreatAnalysisResults> | undefined
  isAuthenticated: boolean
}

const SEVERITY_MESSAGES: Record<Severity, string> = {
  [Severity.OK]: 'No issues found',
  [Severity.INFO]: 'Info available',
  [Severity.WARN]: 'Issues found',
  [Severity.CRITICAL]: 'Blocked',
  [Severity.ERROR]: 'Unavailable',
}

const getSeverityMessage = (severity: Severity): string => {
  return SEVERITY_MESSAGES[severity] || 'Unavailable'
}

const SeverityIcon = ({ severity }: { severity: Severity }) => {
  if (severity === Severity.ERROR) {
    return <BlockIcon className="size-4 text-[var(--color-text-secondary)]" />
  }
  return <SeverityIconSafeShield severity={severity} />
}

export const HnQueueAssessment = ({
  safeTxHash,
  assessment,
  isAuthenticated,
}: HnQueueAssessmentProps): ReactElement | null => {
  const severity = useHnAssessmentSeverity(assessment)
  const assessmentUrl = useAssessmentUrl(safeTxHash)

  // Scan unavailable state (not logged in) - check before assessment
  // since unauthenticated users won't have assessments fetched
  if (!isAuthenticated) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <div className="flex max-w-fit flex-row items-center gap-1">
              <LockIcon className="size-4 text-[var(--color-text-disabled)]" />
              <Typography variant="paragraph-mini" className="text-[var(--color-text-disabled)]">
                {getSeverityMessage(Severity.ERROR)}
              </Typography>
            </div>
          }
        />
        <TooltipContent>
          <Typography variant="paragraph-mini" align="center">
            Log in to Hypernative to view security scan results
          </Typography>
        </TooltipContent>
      </Tooltip>
    )
  }

  if (!assessment) {
    return null
  }

  const [assessmentData, error, isLoading] = assessment

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-row items-center gap-1">
        <Skeleton className="h-3 w-[94px] bg-[var(--color-background-skeleton)]" />
      </div>
    )
  }

  // No assessment data
  if ((!error && !assessmentData) || !severity) {
    return (
      <div className="flex flex-row items-center gap-1">
        <SeverityIcon severity={Severity.ERROR} />
        <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
          {getSeverityMessage(Severity.ERROR)}
        </Typography>
      </div>
    )
  }

  const message = getSeverityMessage(severity)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ExternalLink
            onClick={(e) => e.stopPropagation()}
            href={assessmentUrl}
            className="flex max-w-fit text-muted-foreground no-underline hover:no-underline [&:not(:hover)_.external-link-icon]:hidden [&_.external-link-icon]:text-muted-foreground hover:[&_span]:underline"
          >
            <span className="flex cursor-pointer flex-row items-center gap-1">
              <SeverityIcon severity={severity} />
              <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
                {message}
              </Typography>
            </span>
          </ExternalLink>
        }
      />
      <TooltipContent>
        <div className="flex max-w-[144px] flex-row gap-1">
          <HypernativeIcon className="size-3 text-[var(--color-primary-main)]" />
          <Typography variant="paragraph-mini" align="center">
            Review scan results on Hypernative
          </Typography>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
