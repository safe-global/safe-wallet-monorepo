import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Coins, Layers } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatAmount, formatCurrency } from '@safe-global/utils/utils/formatNumber'
import Identicon from '@safe-global/views/components/common/Identicon'
import { ChainLogo } from '@safe-global/views/features/spaces/components/AddressBookV2/ChainLogos'
import AssetLogo from '@safe-global/views/features/spaces/components/SpaceAssets/AssetLogo'
import { AssetHoldingRow, AssetsGroupRow } from '@safe-global/views/features/spaces/components/SpaceAssets/AssetsRows'
import type { AssetsGroupBy } from '@safe-global/views/features/spaces/components/SpaceAssets/types'
import type { ChainInfo } from '@safe-global/views/features/spaces/types'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { toChainInfos } from '../../utils'
import type { HoldingsGroup, HoldingsRow } from './utils'

type Band = { logo: ReactNode; title: string; subtitle?: string; chains: ChainInfo[]; balance?: string }
type Row = { logo: ReactNode; title: string; subtitle: string }

type AssetsGroupsProps = {
  groups: HoldingsGroup[]
  groupBy: AssetsGroupBy
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
}

/** A band per group, then a row per holding, laid out for the grouping */
const AssetsGroups = ({ groups, groupBy, isCollapsed, onToggle }: AssetsGroupsProps): ReactElement => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const getName = useSafeNameResolver()
  const chainOf = (chainId: string) => toChainInfos([chainId], configs)[0]
  const safeName = (address: string, chainId: string) => getName(address, chainId) || shortenAddress(address)
  const safeLogo = (address: string) => <Identicon address={address} size={32} />
  const assetLogo = (item: { logoUri?: string; symbol: string }) => <AssetLogo src={item.logoUri} label={item.symbol} />
  const details = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' · ')
  const safesLabel = (row: HoldingsRow) =>
    row.safeAddresses.length === 1
      ? safeName(row.safeAddresses[0], row.chainIds[0])
      : `${row.safeAddresses.length} Safe accounts`
  const networksLabel = (row: HoldingsRow) =>
    row.chainIds.length === 1 ? chainOf(row.chainIds[0]).chainName : `${row.chainIds.length} networks`

  const toBand = (group: HoldingsGroup): Band => {
    const [first] = group.rows
    const chains = group.chainIds.map(chainOf)
    if (groupBy === 'asset') {
      return {
        logo: assetLogo(first),
        title: first.symbol,
        subtitle: first.name,
        chains,
        balance: `${formatAmount(group.amount)} ${first.symbol}`,
      }
    }
    if (groupBy === 'type') {
      const isPositions = group.key === 'positions'
      return {
        logo: (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {isPositions ? <Layers className="size-4" /> : <Coins className="size-4" />}
          </span>
        ),
        title: isPositions ? 'Positions' : 'Tokens',
        chains,
      }
    }
    if (groupBy === 'safe') {
      return {
        logo: safeLogo(group.key),
        title: safeName(group.key, group.chainIds[0]),
        subtitle: shortenAddress(group.key),
        chains,
      }
    }
    const chain = chainOf(group.key)
    return { logo: <ChainLogo chain={chain} size="md" />, title: chain.chainName, chains: [] }
  }

  const toRow = (row: HoldingsRow): Row => {
    if (groupBy === 'asset') {
      const chain = chainOf(row.chainIds[0])
      return {
        logo: <ChainLogo chain={chain} size="md" />,
        title: chain.chainName,
        subtitle: details(safesLabel(row), row.protocol),
      }
    }
    const spread = groupBy === 'network' ? safesLabel(row) : networksLabel(row)
    return { logo: assetLogo(row), title: row.name, subtitle: details(row.symbol, row.protocol, spread) }
  }

  return (
    <>
      {groups.map((group) => {
        const collapsed = isCollapsed(group.id)
        return (
          <Fragment key={group.id}>
            <AssetsGroupRow
              {...toBand(group)}
              value={formatCurrency(group.fiat, currency)}
              collapsed={collapsed}
              onToggle={() => onToggle(group.id)}
            />
            {!collapsed &&
              group.rows.map((row) => (
                <AssetHoldingRow
                  key={row.id}
                  {...toRow(row)}
                  type={row.type}
                  balance={`${formatAmount(row.amount)} ${row.symbol}`}
                  value={formatCurrency(row.fiat, currency)}
                />
              ))}
          </Fragment>
        )
      })}
    </>
  )
}

export default AssetsGroups
