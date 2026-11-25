import { useState, type ComponentProps, type ReactElement } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import SafeBandRow from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandRow'
import SafeBandTitle, { SafeBandCard } from '@safe-global/views/features/spaces/components/SpaceQueue/SafeBandTitle'
import { ASSETS_COLUMNS } from '@safe-global/views/features/spaces/components/SpaceAssets/columns'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { toChainInfos } from '../../utils'
import ChainAssets from './ChainAssets'
import { aggregateReports, toAssetsKey, type AssetsSafe, type ChainAssetsReport } from './utils'

const SAFE_ROW_PROPS: ComponentProps<'tr'> & { 'data-testid': string } = { 'data-testid': 'space-assets-safe' }

type SafeAssetsProps = {
  safe: AssetsSafe
  collapsed: boolean
  onToggle: () => void
  /** Position of the Safe's first network in the page's load order */
  firstIndex: number
  loadLimit: number
  retryKey: number
  reports: Record<string, ChainAssetsReport>
  onReport: (chainId: string, address: string, report: ChainAssetsReport) => void
}

/** A Safe's band in the assets table, as in the queue, then its networks */
const SafeAssets = ({
  safe,
  collapsed,
  onToggle,
  firstIndex,
  loadLimit,
  retryKey,
  reports,
  onReport,
}: SafeAssetsProps): ReactElement => {
  const [collapsedChains, setCollapsedChains] = useState<ReadonlySet<string>>(new Set())
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const getName = useSafeNameResolver()
  const chains = toChainInfos(safe.chainIds, configs)
  const name = getName(safe.address, safe.chainIds[0]) || shortenAddress(safe.address)
  const { summary, isLoading, hasSummary } = aggregateReports(
    safe.chainIds.map((chainId) => reports[toAssetsKey(chainId, safe.address)]),
  )
  const total = isLoading ? '…' : hasSummary ? formatCurrency(summary.tokens + summary.positions, currency) : '—'

  const isChainCollapsed = (chainId: string) => collapsed || collapsedChains.has(chainId)
  const isOnlyOpen = (chainId: string) =>
    !collapsed && safe.chainIds.every((id) => isChainCollapsed(id) === (id !== chainId))
  const toggleChain = (chainId: string) =>
    setCollapsedChains((current) => {
      const next = new Set(current)
      if (!next.delete(chainId)) next.add(chainId)
      return next
    })
  // As in the queue: a network's logo shows only that network, or every network when it is already the only one shown
  const focusChain = (chainId: string) => {
    const showAll = isOnlyOpen(chainId)
    if (collapsed) onToggle()
    setCollapsedChains(new Set(showAll ? [] : safe.chainIds.filter((id) => id !== chainId)))
  }

  return (
    <>
      <SafeBandRow
        safeAddress={safe.address}
        title={
          <SafeBandTitle
            safeAddress={safe.address}
            name={name}
            card={
              <SafeBandCard
                name={name}
                address={safe.address}
                details={[{ label: 'Networks', value: chains.map((chain) => chain.chainName).join(', ') }]}
              />
            }
            chains={chains.map((chain) => ({
              chain,
              collapsed: isChainCollapsed(chain.chainId),
              label:
                isOnlyOpen(chain.chainId) && chains.length > 1
                  ? `Show all ${chains.length} networks`
                  : `Show ${chain.chainName}`,
              onClick: () => focusChain(chain.chainId),
            }))}
          />
        }
        collapsed={collapsed}
        summary={total}
        showSummary="always"
        onToggle={onToggle}
        columnCount={ASSETS_COLUMNS.length}
        rowProps={SAFE_ROW_PROPS}
      />
      {safe.chainIds.map((chainId, index) => (
        <ChainAssets
          key={chainId}
          chainId={chainId}
          address={safe.address}
          skip={firstIndex + index >= loadLimit}
          retryKey={retryKey}
          hidden={collapsed}
          collapsed={collapsedChains.has(chainId)}
          onToggle={() => toggleChain(chainId)}
          onReport={onReport}
        />
      ))}
    </>
  )
}

export default SafeAssets
