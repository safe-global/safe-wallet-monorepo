import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { Alert, Typography } from '@mui/material'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { getPrimaryAnalysisResult } from '@safe-global/utils/features/safe-shield/utils/getPrimaryAnalysisResult'
import ExternalLink from '@/components/common/ExternalLink'
import { hnSecurityReportBtnConfig } from '@/features/hypernative/components/HnSecurityReportBtn/config'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { buildSecurityReportUrl } from '@/features/hypernative/utils/buildSecurityReportUrl'

interface HnQueueAssessmentBannerProps {
  safeTxHash: string
  assessment: AsyncResult<ThreatAnalysisResults> | undefined
  isAuthenticated: boolean
  chainId: string
  safeAddress: string
}

export const HnQueueAssessmentBanner = ({
  safeTxHash,
  assessment,
  isAuthenticated,
  chainId,
  safeAddress,
}: HnQueueAssessmentBannerProps): ReactElement | null => {
  const [assessmentData, error] = assessment || [undefined, undefined]

  const primaryResult = useMemo(() => {
    if (!assessmentData) {
      return undefined
    }
    const groupedAssessmentData = {
      ['0x']: {
        THREAT: assessmentData.THREAT,
        CUSTOM_CHECKS: assessmentData.CUSTOM_CHECKS,
      },
    }
    return getPrimaryAnalysisResult(groupedAssessmentData)
  }, [assessmentData])

  const [severity, setSeverity] = useState<Severity | undefined>(primaryResult?.severity)

  const assessmentUrl = buildSecurityReportUrl(hnSecurityReportBtnConfig.baseUrl, chainId, safeAddress, safeTxHash)

  useEffect(() => {
    setSeverity(error ? Severity.ERROR : primaryResult?.severity)
  }, [error, primaryResult?.severity])

  if (!isAuthenticated || error || !assessmentData || severity !== Severity.WARN) {
    return null
  }

  return (
    <Alert severity="warning">
      <Typography variant="body2">Issues found by Hypernative Guardian.</Typography>
      <ExternalLink
        onClick={(e) => e.stopPropagation()}
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
    </Alert>
  )
}
