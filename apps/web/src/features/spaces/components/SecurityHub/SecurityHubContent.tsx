import { type ReactElement, useEffect, useRef, useState } from 'react'
import { Typography } from '@/components/ui/typography'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import SecuritySafesTable from './components/SecuritySafesTable/SecuritySafesTable'
import SecurityReportDrawer from './components/SecurityReportDrawer/SecurityReportDrawer'
import SecurityEmptyState from './components/SecurityEmptyState/SecurityEmptyState'
import WorkspaceHealthCard from './components/WorkspaceHealthCard/WorkspaceHealthCard'
import useReconciledSpaceSafes from './hooks/useReconciledSpaceSafes'
import useScanResultsState from './hooks/useScanResultsState'
import useAutoScanOrchestrator from './hooks/useAutoScanOrchestrator'
import useReportDrawer from './hooks/useReportDrawer'

/**
 * The per-space body of the Security Hub. Mounted under a `key={currentSpaceId}`
 * boundary in {@link SecurityHub} so every space switch produces a fresh instance:
 * the scan-results map, the auto-scan orchestrator's queue refs, and any in-flight
 * scan completions belong to the unmounted instance and can never bleed into the
 * newly selected space's aggregated score or table.
 */
const SecurityHubContent = (): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { isLoadingSpacesSafes, isLoadingOverviews, safes, deployedEntries, balanceMap, overviewMap } =
    useReconciledSpaceSafes(security)
  const { allScanResults, scanTimestamps, lastScannedAt, handleScanComplete } = useScanResultsState(security)
  const { scanningKeys, isRunning, scanIncomplete, startScan } = useAutoScanOrchestrator({
    security,
    deployedEntries,
    safes,
    overviewMap,
    isLoadingSpacesSafes,
    onScanComplete: handleScanComplete,
  })
  const { selectedSafe, selectedEntry, scanContext, openReport, closeReport } = useReportDrawer({
    security,
    safes,
    overviewMap,
  })
  const [gradeFilter, setGradeFilter] = useState<SafeGrade | null>(null)
  const hasTrackedView = useRef(false)

  // Held until the accounts resolve, otherwise the view is always reported as empty.
  // Once per mount is once per space: the parent remounts this on every space switch.
  useEffect(() => {
    if (isLoadingSpacesSafes || hasTrackedView.current) return

    hasTrackedView.current = true
    trackEvent(SPACE_EVENTS.SECURITY_HUB_VIEWED, { [MixpanelEventParams.ACCOUNT_COUNT]: safes.length })
  }, [isLoadingSpacesSafes, safes.length])

  return (
    <>
      {isLoadingSpacesSafes ? (
        <Typography variant="paragraph-small" color="muted">
          Loading accounts...
        </Typography>
      ) : safes.length === 0 ? (
        <SecurityEmptyState />
      ) : (
        <>
          <WorkspaceHealthCard
            safes={safes}
            scanResults={allScanResults}
            isScanning={isRunning}
            activeFilter={gradeFilter}
            onFilterChange={(grade) => setGradeFilter((prev) => (prev === grade ? null : grade))}
            lastScannedAt={lastScannedAt}
            onRescan={() => startScan({ isManual: true })}
            scanIncomplete={scanIncomplete}
          />
          <SecuritySafesTable
            safes={safes}
            onViewReport={openReport}
            selectedSafe={selectedSafe}
            scanResults={allScanResults}
            scanTimestamps={scanTimestamps}
            scanningKeys={scanningKeys}
            gradeFilter={gradeFilter}
            balanceMap={balanceMap}
            isLoading={isLoadingOverviews}
          />
        </>
      )}

      <SecurityReportDrawer
        selectedSafe={selectedSafe}
        selectedEntry={selectedEntry}
        scanContext={scanContext}
        onClose={closeReport}
        onScanComplete={handleScanComplete}
      />
    </>
  )
}

export default SecurityHubContent
