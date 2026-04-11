import { type ReactElement, useMemo, useState, useCallback } from 'react'
import { Box, Collapse, Typography } from '@mui/material'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, type SafeItem, type MultiChainSafeItem } from '@/hooks/safes'
import { useAppSelector } from '@/store'
import { selectUndeployedSafes } from '@/store/slices'
import type { UndeployedSafesState } from '@safe-global/utils/features/counterfactual/store/types'
import type { ScanResult } from '@/features/spaces/data/scanners/types'
import { scanKey } from '@/features/spaces/data/scanners/utils'
import useSafeScanContext from '@/features/spaces/hooks/useSafeScanContext'
import SecuritySafesTable from './SecuritySafesTable'
import SecurityReport from '../SecurityReport'
import SearchInput from '../SearchInput'

export type ChainEntry = {
  chainId: string
  isDeployed: boolean
}

export type SpaceSafeEntry = {
  address: string
  chainId: string
  name?: string
  isMultichain: boolean
  chainEntries: ChainEntry[]
}

export type SelectedSafe = {
  address: string
  chainId: string
}

const flattenSafes = (
  allSafes: Array<SafeItem | MultiChainSafeItem>,
  undeployedSafes: UndeployedSafesState,
): SpaceSafeEntry[] =>
  allSafes.map((item) => {
    if (isMultiChainSafeItem(item)) {
      return {
        address: item.address,
        chainId: item.safes[0]?.chainId ?? '1',
        name: item.name,
        isMultichain: true,
        chainEntries: item.safes.map((s) => ({
          chainId: s.chainId,
          isDeployed: !undeployedSafes[s.chainId]?.[s.address],
        })),
      }
    }
    const isDeployed = !undeployedSafes[item.chainId]?.[item.address]
    return {
      address: item.address,
      chainId: item.chainId,
      name: item.name,
      isMultichain: false,
      chainEntries: [{ chainId: item.chainId, isDeployed }],
    }
  })

const SecurityHub = (): ReactElement => {
  const { allSafes, isLoading } = useSpaceSafes()
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSafe, setSelectedSafe] = useState<SelectedSafe | null>(null)
  const [scanTimestamps, setScanTimestamps] = useState<Record<string, number>>({})
  const [allScanResults, setAllScanResults] = useState<Record<string, Record<string, ScanResult>>>({})

  const safes = useMemo(() => flattenSafes(allSafes, undeployedSafes), [allSafes, undeployedSafes])

  const filteredSafes = useMemo(() => {
    if (!searchQuery) return safes
    const q = searchQuery.toLowerCase()
    return safes.filter((s) => (s.name ?? '').toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
  }, [safes, searchQuery])

  const handleViewReport = useCallback((address: string, chainId: string) => {
    setSelectedSafe((prev) => {
      if (prev && prev.address === address && prev.chainId === chainId) return null
      return { address, chainId }
    })
  }, [])

  const handleScanComplete = useCallback(
    (address: string, chainId: string, timestamp: number, results: Record<string, ScanResult>) => {
      const key = scanKey(address, chainId)
      setScanTimestamps((prev) => ({ ...prev, [key]: timestamp }))
      setAllScanResults((prev) => ({ ...prev, [key]: results }))
    },
    [],
  )

  const selectedEntry = useMemo(() => safes.find((s) => s.address === selectedSafe?.address), [safes, selectedSafe])
  const scanContext = useSafeScanContext(selectedSafe, selectedEntry)
  const selectedKey = selectedSafe ? scanKey(selectedSafe.address, selectedSafe.chainId) : null

  return (
    <Box data-testid="security-hub">
      <Typography variant="h1" mb={3}>
        Security hub
      </Typography>

      <Box mb={3}>
        <SearchInput onSearch={setSearchQuery} />
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading accounts...
        </Typography>
      ) : safes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No Safe accounts in this space yet.
        </Typography>
      ) : filteredSafes.length === 0 ? (
        <Typography variant="h5" fontWeight="normal" color="primary.light">
          No accounts match your search
        </Typography>
      ) : (
        <SecuritySafesTable
          safes={filteredSafes}
          onViewReport={handleViewReport}
          selectedSafe={selectedSafe}
          scanTimestamps={scanTimestamps}
          scanResults={allScanResults}
        />
      )}

      <Collapse in={!!selectedSafe} timeout={{ enter: 400, exit: 200 }} unmountOnExit>
        <Box mt={5}>
          {selectedSafe && (
            <SecurityReport
              key={selectedKey!}
              safeAddress={selectedSafe.address}
              safeName={selectedEntry?.name}
              chainId={selectedSafe.chainId}
              scanContext={scanContext}
              onScanComplete={handleScanComplete}
            />
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

export default SecurityHub
