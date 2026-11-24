import { useState, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import SafeAssetsBand from '@safe-global/views/features/spaces/components/SpaceAssets/SafeAssetsBand'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { toChainInfos } from '../../utils'
import ChainAssets from './ChainAssets'
import { aggregateReports, toAssetsKey, type AssetsSafe, type ChainAssetsReport } from './utils'

type SafeAssetsProps = {
  safe: AssetsSafe
  /** Position of the Safe's first network in the page's load order */
  firstIndex: number
  loadLimit: number
  retryKey: number
  reports: Record<string, ChainAssetsReport>
  onReport: (chainId: string, address: string, report: ChainAssetsReport) => void
}

const SafeAssets = ({ safe, firstIndex, loadLimit, retryKey, reports, onReport }: SafeAssetsProps): ReactElement => {
  const [collapsed, setCollapsed] = useState(false)
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const getName = useSafeNameResolver()
  const { summary, isLoading, hasSummary } = aggregateReports(
    safe.chainIds.map((chainId) => reports[toAssetsKey(chainId, safe.address)]),
  )

  return (
    <SafeAssetsBand
      address={safe.address}
      name={getName(safe.address, safe.chainIds[0]) || shortenAddress(safe.address)}
      chains={toChainInfos(safe.chainIds, configs)}
      total={isLoading ? undefined : hasSummary ? formatCurrency(summary.tokens + summary.positions, currency) : '—'}
      collapsed={collapsed}
      onToggle={() => setCollapsed((current) => !current)}
    >
      {safe.chainIds.map((chainId, index) => (
        <ChainAssets
          key={chainId}
          chainId={chainId}
          address={safe.address}
          skip={firstIndex + index >= loadLimit}
          retryKey={retryKey}
          onReport={onReport}
        />
      ))}
    </SafeAssetsBand>
  )
}

export default SafeAssets
