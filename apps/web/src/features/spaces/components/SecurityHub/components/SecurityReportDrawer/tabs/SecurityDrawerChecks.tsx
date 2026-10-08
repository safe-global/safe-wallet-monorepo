import type { ReactElement } from 'react'
import type { ScanContext, ScanResult } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { usePanelHeader } from '../../SecurityChecks/hooks/usePanelHeader'
import SecurityChecksSection from '../../SecurityChecks/SecurityChecksSection'
import { SecurityDrawerChecksView } from '@views/features/spaces/components/SecurityHub/components/SecurityReportDrawer/tabs/SecurityDrawerChecksView'

type SecurityDrawerChecksProps = {
  scanContext: ScanContext | null
  results: Record<string, ScanResult>
  isComplete: boolean
  lastScannedAt: number | null
  /** The `shortName:address` param used to deep-link a CTA to the correct Safe (e.g., "eth:0x..."). */
  safeQueryParam?: string
  onHnSignupClick?: () => void
}

/**
 * "Checks" tab — a score summary card (gauge + issue count + scan time) followed by the
 * existing per-check rows.
 */
const SecurityDrawerChecks = ({
  scanContext,
  results,
  isComplete,
  lastScannedAt,
  safeQueryParam,
  onHnSignupClick,
}: SecurityDrawerChecksProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const header = usePanelHeader(results, isComplete)
  const hasResults = Object.keys(results).length > 0

  if (!scanContext || !security.$isReady || header.status === 'loading' || (!hasResults && !isComplete)) {
    return <SecurityDrawerChecksView isLoading />
  }

  const summary = security.computeSummary(results)
  const issueCount = summary ? summary.applicableCount - summary.passing : 0

  return (
    <SecurityDrawerChecksView
      isLoading={false}
      header={header.status === 'ready' ? { score: header.score, color: header.band.color } : undefined}
      issueCount={issueCount}
      scannedAt={security.formatTimestamp(lastScannedAt ?? undefined)}
      checksSection={
        <SecurityChecksSection
          scanContext={scanContext}
          results={results}
          safeQueryParam={safeQueryParam}
          onHnSignupClick={onHnSignupClick}
        />
      }
    />
  )
}

export default SecurityDrawerChecks
