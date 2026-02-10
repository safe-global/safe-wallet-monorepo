import { type ReactElement } from 'react'
import { Skeleton, Stack, SvgIcon, Tooltip, Typography } from '@mui/material'
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
    return (
      <SvgIcon inheritViewBox component={BlockIcon} sx={{ width: '16px', height: '16px', color: 'text.secondary' }} />
    )
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
      <Tooltip
        title={
          <Typography variant="caption" letterSpacing={0} align="center">
            Log in to Hypernative to view security scan results
          </Typography>
        }
        arrow
        placement="top"
      >
        <Stack direction="row" alignItems="center" maxWidth="fit-content" gap={0.5}>
          <SvgIcon inheritViewBox component={LockIcon} sx={{ width: '16px', height: '16px', color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
            {getSeverityMessage(Severity.ERROR)}
          </Typography>
        </Stack>
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
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Skeleton variant="text" width={94} height={12} color="background.skeleton" />
      </Stack>
    )
  }

  // No assessment data
  if ((!error && !assessmentData) || !severity) {
    return (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <SeverityIcon severity={Severity.ERROR} />
        <Typography variant="caption" color="text.secondary">
          {getSeverityMessage(Severity.ERROR)}
        </Typography>
      </Stack>
    )
  }

  const message = getSeverityMessage(severity)

  return (
    <Tooltip
      title={
        <Stack gap={0.5} direction="row" maxWidth="144px">
          <SvgIcon component={HypernativeIcon} fontSize="inherit" inheritViewBox color="primary" />
          <Typography variant="caption" letterSpacing={0} align="center">
            Review scan results on Hypernative
          </Typography>
        </Stack>
      }
      arrow
      placement="top"
    >
      <ExternalLink
        onClick={(e) => e.stopPropagation()}
        href={assessmentUrl}
        color="text.secondary"
        display="flex"
        maxWidth="fit-content"
        sx={{
          textDecoration: 'none',
          '&:not(:hover)': { '.external-link-icon': { display: 'none' } },
          '.external-link-icon': { color: 'text.secondary' },
          '&:hover': { span: { textDecoration: 'underline' } },
        }}
      >
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ cursor: 'pointer' }}>
          <SeverityIcon severity={severity} />
          <Typography variant="caption" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </ExternalLink>
    </Tooltip>
  )
}
