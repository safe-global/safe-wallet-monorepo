import { useCallback, useMemo, useState } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
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
      if (prev && sameAddress(prev.address, address) && prev.chainId === chainId) return null
      return { address, chainId }
    })
  }, [])

  const closeReport = useCallback(() => setSelectedSafe(null), [])

  const selectedEntry = useMemo(() => {
    if (!selectedSafe) return undefined
    // Multichain Safes share the same address across chains, so a plain address match
    // can return a row whose chainEntries don't include the selected chain.
    return safes.find(
      (s) =>
        sameAddress(s.address, selectedSafe.address) && s.chainEntries.some((c) => c.chainId === selectedSafe.chainId),
    )
  }, [safes, selectedSafe])

  const drawerOverview =
    selectedSafe && security.$isReady
      ? overviewMap[security.scanKey(selectedSafe.address, selectedSafe.chainId)]
      : undefined

  const scanContext = useSafeScanContext(selectedSafe, selectedEntry, drawerOverview)

  return { selectedSafe, selectedEntry, scanContext, openReport, closeReport }
}

export default useReportDrawer
