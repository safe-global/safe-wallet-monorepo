import { useCallback, useMemo, useState } from 'react'
import type { ScanContext } from '@/features/security/types'
import type { useLoadFeature } from '@/features/__core__'
import type { SecurityContract } from '@/features/security'
import useSafeScanContext from '@/features/spaces/hooks/useSafeScanContext'
import type { OverviewMap, SelectedSafe, SpaceSafeEntry } from '../types'

type SecurityHandle = ReturnType<typeof useLoadFeature<SecurityContract>>

export type UseReportDrawerParams = {
  security: SecurityHandle
  safes: SpaceSafeEntry[]
  overviewMap: OverviewMap
}

export type ReportDrawerState = {
  selectedSafe: SelectedSafe | null
  selectedEntry: SpaceSafeEntry | undefined
  scanContext: ScanContext | null
  openReport: (address: string, chainId: string) => void
  closeReport: () => void
}

/**
 * Owns the report drawer's selection state and its dependent derivations:
 * the matching `SpaceSafeEntry`, the pre-fetched overview to skip a redundant
 * per-Safe overview request, and the drawer's `ScanContext` for the
 * security panel.
 */
const useReportDrawer = ({ security, safes, overviewMap }: UseReportDrawerParams): ReportDrawerState => {
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(null)

  const openReport = useCallback((address: string, chainId: string) => {
    setSelectedSafe((prev) => {
      if (prev && prev.address === address && prev.chainId === chainId) return null
      return { address, chainId }
    })
  }, [])

  const closeReport = useCallback(() => setSelectedSafe(null), [])

  const selectedEntry = useMemo(() => safes.find((s) => s.address === selectedSafe?.address), [safes, selectedSafe])

  const drawerOverview =
    selectedSafe && security.$isReady
      ? overviewMap[security.scanKey(selectedSafe.address, selectedSafe.chainId)]
      : undefined

  const scanContext = useSafeScanContext(selectedSafe, selectedEntry, drawerOverview)

  return { selectedSafe, selectedEntry, scanContext, openReport, closeReport }
}

export default useReportDrawer
