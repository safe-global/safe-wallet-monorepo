import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Box, Table, TableCell, TableHead, TableRow } from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'
import { COLUMNS, MotionTbody, TABLE_SX, TABLE_WRAPPER_SX } from './constants'
import SingleSafeRow from './SingleSafeRow'
import MultichainSafeRow from './MultichainSafeRow'
import type { GetSafeSecurityHref } from './utils'

type SecuritySafesTableProps = {
  safes: SpaceSafeEntry[]
  onViewReport: (address: string, chainId: string) => void
  selectedSafe: SelectedSafe | null
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  gradeFilter?: SafeGrade | null
  balanceMap: Record<string, string | undefined>
}

const SecuritySafesTable = ({
  safes,
  onViewReport,
  selectedSafe,
  scanResults,
  scanTimestamps,
  scanningKeys,
  gradeFilter,
  balanceMap,
}: SecuritySafesTableProps): ReactElement => {
  const security = useLoadFeature(SecurityFeature)
  const { data: chainsData } = useGetChainsConfigV2Query(CONFIG_SERVICE_KEY)
  const chainShortNames = useMemo(() => {
    if (!chainsData) return {}
    const map: Record<string, string> = {}
    for (const id of chainsData.ids) {
      const chain = chainsData.entities[id]
      if (chain) map[chain.chainId] = chain.shortName
    }
    return map
  }, [chainsData])

  // Link the Safe name to that Safe's home dashboard. The per-Safe security view
  // now lives entirely inside this hub's drawer — clicking the row still opens it.
  const getSafeSecurityHref = useCallback<GetSafeSecurityHref>(
    (address, chainId) => {
      const shortName = chainShortNames[chainId]
      if (!shortName) return undefined
      return { pathname: AppRoutes.home, query: { safe: `${shortName}:${address}` } }
    },
    [chainShortNames],
  )

  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((address: string) => {
    setExpandedAddresses((prev) => {
      const next = new Set(prev)
      if (next.has(address)) next.delete(address)
      else next.add(address)
      return next
    })
  }, [])

  // Skip initial-load stagger after the first render — filter transitions should be instant
  const hasAnimatedRef = useRef(false)
  useEffect(() => {
    hasAnimatedRef.current = true
  }, [])

  // Filter safes by grade when a chip filter is active
  const filteredSafes = useMemo(() => {
    if (!gradeFilter) return safes
    if (!security.$isReady) return safes
    return safes.filter((safe) => {
      // For multichain Safes, match if ANY chain matches the grade
      for (const chain of safe.chainEntries) {
        const key = security.scanKey(safe.address, chain.chainId)
        const results = scanResults[key]
        if (results && security.getSafeGrade(results) === gradeFilter) return true
      }
      return false
    })
  }, [safes, scanResults, gradeFilter, security.$isReady, security.scanKey, security.getSafeGrade])

  // Gate remaining render on feature load. Utilities are synchronous call-site primitives —
  // pulling them via useLoadFeature means we must wait for the module to resolve.
  // Since FEATURES.SPACES is already enabled on this page, this is a very brief state.
  if (!security.$isReady) return <></>

  return (
    <Box sx={TABLE_WRAPPER_SX}>
      <Table sx={TABLE_SX}>
        <TableHead>
          <TableRow>
            {COLUMNS.map((c, i) => (
              <TableCell key={c.label || `col-${i}`} sx={{ width: c.width }}>
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <AnimatePresence mode="wait">
          <MotionTbody
            key={gradeFilter ?? 'all'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {filteredSafes.map((safe, safeIdx) => {
              const isMultichain = safe.isMultichain && safe.chainEntries.length > 1
              const sharedProps = {
                safe,
                safeIdx,
                hasAnimated: hasAnimatedRef.current,
                selectedSafe,
                onViewReport,
                scanResults,
                scanTimestamps,
                scanningKeys,
                balanceMap,
                security,
                getSafeSecurityHref,
              }
              return isMultichain ? (
                <MultichainSafeRow
                  key={safe.address}
                  {...sharedProps}
                  isExpanded={expandedAddresses.has(safe.address)}
                  onToggleExpand={toggleExpand}
                />
              ) : (
                <SingleSafeRow key={security.scanKey(safe.address, safe.chainId)} {...sharedProps} />
              )
            })}
          </MotionTbody>
        </AnimatePresence>
      </Table>
    </Box>
  )
}

export default SecuritySafesTable
