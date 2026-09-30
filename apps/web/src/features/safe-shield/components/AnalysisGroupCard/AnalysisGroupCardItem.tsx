import { useState } from 'react'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import type { Severity } from '@safe-global/utils/features/safe-shield/types'
import {
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
import { AnalysisDetailsDropdown } from '../AnalysisDetailsDropdown'

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
    <>
      <div className="overflow-hidden rounded-[4px] bg-[var(--color-background-main)]">
        <div className="border-l-4 p-3" style={{ borderLeftColor: borderColor }}>
          <div className="flex flex-col gap-4">
            <Typography variant="paragraph-small" className="break-words text-[var(--color-primary-light)]">
              {displayDescription}
            </Typography>

            {hasError && (
              <AnalysisDetailsDropdown
                showLabel="Show details"
                hideLabel="Hide details"
                contentWrapper={(children) => (
                  <div className="mt-1 rounded-[4px] bg-[var(--color-background-paper)] px-2 py-1 break-words">
                    {children}
                  </div>
                )}
              >
                <Typography variant="paragraph-mini" className="leading-[14px] text-[var(--color-text-secondary)]">
                  {result.error}
                </Typography>
              </AnalysisDetailsDropdown>
            )}

            <AnalysisIssuesDisplay result={result} issueBackgroundColor={issueBackgroundColor} />

            {isAddressChange(result) && <AddressChanges result={result} />}

            {/* Only show ShowAllAddress dropdown if there are no issues (to avoid duplication) */}
            {!hasIssues && result.addresses?.length && (
              <ShowAllAddress addresses={result.addresses} showImage={showImage} />
            )}

            {shouldShowReportLink && (
              <Link
                variant="inherit"
                render={<button type="button" />}
                onClick={() => setIsReportModalOpen(true)}
                className="cursor-pointer text-left text-xs leading-4 font-normal text-[var(--color-text-secondary)] no-underline hover:no-underline"
              >
                Report false result
              </Link>
            )}
          </div>
        </div>
      </div>

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
