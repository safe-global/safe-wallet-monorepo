import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { cn } from '@/utils/cn'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'
import { COLUMNS, GRID_COLS } from './constants'
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
    <div className="mb-10 w-full overflow-x-auto">
      <div className="min-w-[960px]">
        <div
          className={cn(
            'grid w-full items-center gap-2 border-2 border-transparent pb-1 pl-3 pr-3 sm:pl-6 sm:pr-6',
            GRID_COLS,
          )}
        >
          {COLUMNS.map((c, i) => (
            <div
              key={c.label || `col-${i}`}
              className={cn('text-[0.65rem] font-bold uppercase tracking-[0.5px] text-zinc-400', c.hideClass, {
                'justify-end': c.align === 'right',
              })}
            >
              {c.label}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={gradeFilter ?? 'all'}
            className="flex flex-col gap-1.5"
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
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SecuritySafesTable
