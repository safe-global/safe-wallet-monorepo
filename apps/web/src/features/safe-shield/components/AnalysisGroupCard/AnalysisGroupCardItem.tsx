import { useState } from 'react'
import { Box, Link, Stack, Typography } from '@mui/material'
import {
  type Severity,
  type AnalysisResult,
  type MaliciousOrModerateThreatAnalysisResult,
  ThreatStatus,
} from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { SEVERITY_COLORS } from '../../constants'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { AddressChanges } from '../AddressChanges'
import { ShowAllAddress } from '../ShowAllAddress/ShowAllAddress'
import { ReportFalseResultModal } from '../ReportFalseResultModal'

interface AnalysisGroupCardItemProps {
  result: AnalysisResult
  description?: React.ReactNode
  severity?: Severity
  showImage?: boolean
  requestId?: string
}

export const AnalysisGroupCardItem = ({
  result,
  description,
  severity,
  showImage,
  requestId,
}: AnalysisGroupCardItemProps) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const borderColor = severity ? SEVERITY_COLORS[severity].main : 'var(--color-border-main)'
  const displayDescription = description ?? result.description
  const hasIssues = 'issues' in result && !!(result as MaliciousOrModerateThreatAnalysisResult).issues
  const isThreatDetected = result.type === ThreatStatus.MALICIOUS || result.type === ThreatStatus.MODERATE
  const shouldShowReportLink = isThreatDetected && requestId

  return (
    <>
      <Box bgcolor="background.main" borderRadius="4px" overflow="hidden">
        <Box sx={{ borderLeft: `4px solid ${borderColor}`, padding: '12px' }}>
          <Stack gap={2}>
            <Typography variant="body2" color="primary.light">
              {displayDescription}
            </Typography>

            <AnalysisIssuesDisplay result={result} />

            {isAddressChange(result) && <AddressChanges result={result} />}

            {/* Only show ShowAllAddress dropdown if there are no issues (to avoid duplication) */}
            {!hasIssues && result.addresses?.length && (
              <ShowAllAddress addresses={result.addresses} showImage={showImage} />
            )}

            {shouldShowReportLink && (
              <Link
                component="button"
                variant="body2"
                color="text.secondary"
                onClick={() => setIsReportModalOpen(true)}
                sx={{ cursor: 'pointer', textAlign: 'left', textDecoration: 'none', fontWeight: 'normal' }}
              >
                Report false result
              </Link>
            )}
          </Stack>
        </Box>
      </Box>

      {shouldShowReportLink && (
        <ReportFalseResultModal
          open={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          requestId={requestId}
        />
      )}
    </>
  )
}
