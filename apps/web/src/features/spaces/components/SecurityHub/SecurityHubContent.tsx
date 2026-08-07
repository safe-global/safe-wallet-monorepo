import { type ReactElement, useState } from 'react'
import { Typography } from '@mui/material'
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

  return (
    <>
      {isLoadingSpacesSafes ? (
        <Typography variant="body2" color="text.secondary">
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
