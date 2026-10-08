import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosList } from '@/features/multichain'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import StatusCell from '../StatusCell/StatusCell'
import {
  formatBalance,
  getAggregateNonPassingCount,
  getAggregateSafeGrade,
  getAggregateSummary,
  getNonPassingCount,
  hasMultichainWarning,
  isAnyChainScanning,
  type GetSafeSecurityHref,
  type RowSecurity,
} from './utils'
import {
  MultichainChildRowView,
  MultichainSafeRowView,
} from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/MultichainSafeRowView'
import type { ChainEntry, SelectedSafe, SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'

export type MultichainSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  isExpanded: boolean
  onToggleExpand: (address: string) => void
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

type ChildRowProps = {
  safe: SpaceSafeEntry
  chain: ChainEntry
  childIdx: number
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

const MultichainChildRow = ({
  safe,
  chain,
  childIdx,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: ChildRowProps) => {
  const { scanKey, computeSummary, getSafeGrade } = security
  const key = scanKey(safe.address, chain.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const childGrade = results ? getSafeGrade(results) : null
  const childStatusCount = getNonPassingCount(results)
  const isSelected = sameAddress(selectedSafe?.address, safe.address) && selectedSafe?.chainId === chain.chainId
  const isScanning = scanningKeys?.has(key)
  const childHref = getSafeSecurityHref(safe.address, chain.chainId)
  const childName = safe.name || shortenAddress(safe.address)

  return (
    <MultichainChildRowView
      name={childName}
      childIdx={childIdx}
      isDeployed={chain.isDeployed}
      isSelected={isSelected}
      isScanning={isScanning}
      href={childHref}
      balance={balanceMap[key]}
      formattedBalance={formatBalance(balanceMap[key])}
      summary={summary}
      onViewReport={() => onViewReport(safe.address, chain.chainId)}
      identicon={<Identicon address={safe.address} size={24} />}
      chainLogo={<ChainIndicator chainId={chain.chainId} onlyLogo imageSize={18} />}
      statusCell={<StatusCell grade={childGrade} count={childStatusCount} isScanning={isScanning} />}
    />
  )
}

const MultichainSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  isExpanded,
  onToggleExpand,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: MultichainSafeRowProps) => {
  const { scanKey, getSafeGrade } = security
  const aggregateSummary = getAggregateSummary(safe, scanResults, security)
  const aggregateGrade = getAggregateSafeGrade(safe, scanResults, scanKey, getSafeGrade)
  const aggregateNonPassing = getAggregateNonPassingCount(safe, scanResults, scanKey)
  const aggregateScanning = isAnyChainScanning(safe, scanningKeys, scanKey)
  const showMultichainWarning = hasMultichainWarning(safe, scanResults, scanKey)
  const totalBalance = safe.chainEntries.reduce(
    (sum, c) => sum + (Number(balanceMap[scanKey(safe.address, c.chainId)]) || 0),
    0,
  )

  return (
    <MultichainSafeRowView
      address={safe.address}
      name={safe.name}
      safeIdx={safeIdx}
      hasAnimated={hasAnimated}
      isExpanded={isExpanded}
      onToggleExpand={() => onToggleExpand(safe.address)}
      showMultichainWarning={showMultichainWarning}
      chainCount={safe.chainEntries.length}
      formattedTotalBalance={formatBalance(String(totalBalance))}
      aggregateSummary={aggregateSummary}
      aggregateScanning={aggregateScanning}
      identicon={<Identicon address={safe.address} size={32} />}
      copyButton={<CopyAddressIconButton address={safe.address} />}
      networkLogos={
        <NetworkLogosList
          networks={safe.chainEntries.slice(0, 3).map((c) => ({ chainId: c.chainId }))}
          imageSize={18}
        />
      }
      statusCell={<StatusCell grade={aggregateGrade} count={aggregateNonPassing} isScanning={aggregateScanning} />}
      childRows={
        isExpanded &&
        safe.chainEntries.map((chain, childIdx) => (
          <MultichainChildRow
            key={scanKey(safe.address, chain.chainId)}
            safe={safe}
            chain={chain}
            childIdx={childIdx}
            selectedSafe={selectedSafe}
            onViewReport={onViewReport}
            scanResults={scanResults}
            scanningKeys={scanningKeys}
            balanceMap={balanceMap}
            security={security}
            getSafeSecurityHref={getSafeSecurityHref}
          />
        ))
      }
    />
  )
}

export default MultichainSafeRow
