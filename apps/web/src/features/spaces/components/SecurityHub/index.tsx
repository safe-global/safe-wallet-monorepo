import { type ReactElement, useState } from 'react'
import { Box, Typography } from '@mui/material'
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

export type { BalanceMap, OverviewMap, SelectedSafe, SpaceSafeEntry, ChainEntry } from './types'

const SecurityHub = (): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { isLoadingSpacesSafes, safes, deployedEntries, balanceMap, overviewMap } = useReconciledSpaceSafes(security)
  const { allScanResults, scanTimestamps, lastScannedAt, handleScanComplete } = useScanResultsState(security)
  const { scanningKeys, isRunning, startScan } = useAutoScanOrchestrator({
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
    <Box data-testid="security-hub">
      <Box mb={3}>
        <Typography variant="h1" mb={0.5}>
          Security
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of security checks across your accounts.
        </Typography>
      </Box>

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
            onRescan={startScan}
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
    </Box>
  )
}

export default SecurityHub
