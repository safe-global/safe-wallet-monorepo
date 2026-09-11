import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { cn } from '@/utils/cn'
import { Skeleton } from '@/components/ui/skeleton'
import type { SelectedSafe, SpaceSafeEntry } from '../../types'
import { CARD_ROW_CLASS, CELL_BASE, COLUMNS, GRID_COLS, HIDE_BALANCE } from './constants'
import SingleSafeRow from './SingleSafeRow'
import MultichainSafeRow from './MultichainSafeRow'
import { buildSafeSecurityHref, type GetSafeSecurityHref } from './utils'

type SecuritySafesTableProps = {
  safes: SpaceSafeEntry[]
  onViewReport: (address: string, chainId: string) => void
  selectedSafe: SelectedSafe | null
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  gradeFilter?: SafeGrade | null
  balanceMap: Record<string, string | undefined>
  /** Render skeleton rows while the batch overview query resolves, so deployment
   *  flags and balances are correct on first paint instead of flipping. */
  isLoading?: boolean
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
  isLoading = false,
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

  // Link the Safe name to that Safe's security settings, so navigating back from there returns
  // to the Workspace Security Hub rather than the Home tab. Clicking the row still opens the drawer.
  const getSafeSecurityHref = useCallback<GetSafeSecurityHref>(
    (address, chainId) => buildSafeSecurityHref(chainShortNames, address, chainId),
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
              className={cn('text-[0.65rem] font-bold uppercase tracking-[0.5px] text-muted-foreground', c.hideClass, {
                'justify-end': c.align === 'right',
              })}
            >
              {c.label}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-1.5" data-testid="security-safes-table-skeleton">
            {Array.from({ length: Math.min(Math.max(safes.length, 1), 6) }).map((_, i) => (
              <div key={i} className={cn(CARD_ROW_CLASS, GRID_COLS, 'border-transparent')}>
                {/* Account: identicon + name/address — mirrors SingleSafeRow's first cell */}
                <div className={CELL_BASE}>
                  <div className="flex min-w-0 items-center gap-2">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-32 max-w-full rounded" />
                      <Skeleton className="h-2.5 w-24 max-w-full rounded" />
                    </div>
                  </div>
                </div>
                {/* Network */}
                <div className={CELL_BASE}>
                  <Skeleton className="size-[18px] rounded-full" />
                </div>
                {/* Balance (collapses below sm, same as the data cell) */}
                <div className={cn(CELL_BASE, HIDE_BALANCE)}>
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
                {/* Score */}
                <div className={CELL_BASE}>
                  <Skeleton className="h-4 w-9 rounded" />
                </div>
                {/* Status */}
                <div className={CELL_BASE}>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {/* Chevron */}
                <div className={cn(CELL_BASE, 'justify-end')}>
                  <Skeleton className="size-5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

export default SecuritySafesTable
