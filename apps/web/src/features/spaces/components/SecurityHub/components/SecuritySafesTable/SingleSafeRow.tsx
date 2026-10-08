import type { ScanResult } from '@/features/security/types'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import ChainIndicator from '@/components/common/ChainIndicator'
import StatusCell from '../StatusCell/StatusCell'
import { formatBalance, getNonPassingCount, type GetSafeSecurityHref, type RowSecurity } from './utils'
import { SingleSafeRowView } from '@views/features/spaces/components/SecurityHub/components/SecuritySafesTable/SingleSafeRowView'
import type { SelectedSafe, SpaceSafeEntry } from '@views/features/spaces/components/SecurityHub/types'

export type SingleSafeRowProps = {
  safe: SpaceSafeEntry
  safeIdx: number
  hasAnimated: boolean
  selectedSafe: SelectedSafe | null
  onViewReport: (address: string, chainId: string) => void
  scanResults: Record<string, Record<string, ScanResult>>
  scanTimestamps?: Record<string, number>
  scanningKeys?: Set<string>
  balanceMap: Record<string, string | undefined>
  security: RowSecurity
  getSafeSecurityHref: GetSafeSecurityHref
}

/** Row for a Safe deployed on exactly one chain. */
const SingleSafeRow = ({
  safe,
  safeIdx,
  hasAnimated,
  selectedSafe,
  onViewReport,
  scanResults,
  scanningKeys,
  balanceMap,
  security,
  getSafeSecurityHref,
}: SingleSafeRowProps) => {
  const { scanKey, computeSummary, getSafeGrade } = security
  const key = scanKey(safe.address, safe.chainId)
  const results = scanResults[key]
  const summary = results ? computeSummary(results) : null
  const grade = results ? getSafeGrade(results) : null
  const statusCount = getNonPassingCount(results)
  const isSelected = selectedSafe?.address === safe.address && selectedSafe?.chainId === safe.chainId
  const isScanning = scanningKeys?.has(key)
  const safeHref = getSafeSecurityHref(safe.address, safe.chainId)
  const isDeployed = safe.chainEntries[0]?.isDeployed !== false

  return (
    <SingleSafeRowView
      address={safe.address}
      name={safe.name}
      safeIdx={safeIdx}
      hasAnimated={hasAnimated}
      isDeployed={isDeployed}
      isSelected={isSelected}
      isScanning={isScanning}
      href={safeHref}
      balance={balanceMap[key]}
      formattedBalance={formatBalance(balanceMap[key])}
      summary={summary}
      onViewReport={() => onViewReport(safe.address, safe.chainId)}
      identicon={<Identicon address={safe.address} size={32} />}
      copyButton={<CopyAddressIconButton address={safe.address} />}
      chainLogo={<ChainIndicator chainId={safe.chainId} onlyLogo imageSize={18} />}
      statusCell={<StatusCell grade={grade} count={statusCount} isScanning={isScanning} />}
    />
  )
}

export default SingleSafeRow
