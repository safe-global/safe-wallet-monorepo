import { useState } from 'react'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
  type AnalysisResult,
  type MaliciousOrModerateThreatAnalysisResult,
  ThreatStatus,
} from '@safe-global/utils/features/safe-shield/types'
import { isAddressChange } from '@safe-global/utils/features/safe-shield/utils'
import { SEVERITY_COLORS } from '../../constants'
import { AnalysisIssuesDisplay } from '../AnalysisIssuesDisplay'
import { AddressChanges } from '@views/features/safe-shield/components/AddressChanges'
import { ShowAllAddress } from '../ShowAllAddress/ShowAllAddress'
import { ReportFalseResultModal } from '../ReportFalseResultModal'
import { AnalysisGroupCardItemView } from '@views/features/safe-shield/components/AnalysisGroupCard/AnalysisGroupCardItemView'

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
  const issueBackgroundColor = severity ? SEVERITY_COLORS[severity].background : ''
  const displayDescription = description ?? result.description
  const hasIssues = 'issues' in result && !!(result as MaliciousOrModerateThreatAnalysisResult).issues
  const isThreatDetected = result.type === ThreatStatus.MALICIOUS || result.type === ThreatStatus.MODERATE
  const shouldShowReportLink = isThreatDetected && requestId
  const hasError = Boolean(result.error)

  return (
    <AnalysisGroupCardItemView
      borderColor={borderColor}
      description={displayDescription}
      hasError={hasError}
      error={result.error}
      issuesDisplay={<AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />}
      addressChanges={isAddressChange(result) && <AddressChanges result={result} />}
      // Only show ShowAllAddress if there are no issues (to avoid duplication)
      showAllAddress={
        !hasIssues && result.addresses?.length && <ShowAllAddress addresses={result.addresses} showImage={showImage} />
      }
      showReportLink={shouldShowReportLink}
      onReportClick={() => setIsReportModalOpen(true)}
      reportModal={
        shouldShowReportLink && (
          <ReportFalseResultModal
            open={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            requestId={requestId}
          />
        )
      }
    />
  )
}
