import { type ReactElement, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import type { ScanResult, SafeGrade } from '@/features/security/types'
import { SecurityFeature } from '@/features/security'
import { useLoadFeature } from '@/features/__core__'
import { useGetChainsConfigV2Query } from '@safe-global/store/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { SelectedSafe, SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'
import { SecuritySafesTableView } from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/SecuritySafesTableView'
import SingleSafeRow from './SingleSafeRow'
import MultichainSafeRow from './MultichainSafeRow'
import { buildSafeSecurityHref, type GetSafeSecurityHref } from './utils'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'

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
  const spaceId = useUrlSpaceId()
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
    (address, chainId) => buildSafeSecurityHref(chainShortNames, address, chainId, spaceId),
    [chainShortNames, spaceId],
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
    <SecuritySafesTableView
      isLoading={isLoading}
      safesCount={safes.length}
      gradeFilter={gradeFilter}
      rows={filteredSafes.map((safe, safeIdx) => {
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
    />
  )
}

export default SecuritySafesTable
