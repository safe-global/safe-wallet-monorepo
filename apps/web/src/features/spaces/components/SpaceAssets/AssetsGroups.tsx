import { Fragment, type ReactElement, type ReactNode } from 'react'
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
import type { AssetHolding, HoldingsGroup } from './utils'

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
  const assetLogo = (holding: AssetHolding) => <AssetLogo src={holding.logoUri} label={holding.symbol} />
  const details = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' · ')

  const toBand = (group: HoldingsGroup): Band => {
    const first = group.holdings[0]
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
    if (groupBy === 'safe') {
      return {
        logo: safeLogo(first.safeAddress),
        title: safeName(first.safeAddress, first.chainId),
        subtitle: shortenAddress(first.safeAddress),
        chains,
      }
    }
    return {
      logo: <ChainLogo chain={chainOf(first.chainId)} size="md" />,
      title: chainOf(first.chainId).chainName,
      chains: [],
    }
  }

  const toRow = (holding: AssetHolding): Row => {
    const chainName = chainOf(holding.chainId).chainName
    if (groupBy === 'asset') {
      return {
        logo: safeLogo(holding.safeAddress),
        title: safeName(holding.safeAddress, holding.chainId),
        subtitle: details(chainName, holding.protocol),
      }
    }
    if (groupBy === 'safe') {
      return {
        logo: assetLogo(holding),
        title: holding.name,
        subtitle: details(holding.symbol, holding.protocol, chainName),
      }
    }
    return {
      logo: assetLogo(holding),
      title: holding.name,
      subtitle: details(holding.symbol, holding.protocol, safeName(holding.safeAddress, holding.chainId)),
    }
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
              group.holdings.map((holding) => (
                <AssetHoldingRow
                  key={holding.id}
                  {...toRow(holding)}
                  type={holding.type}
                  balance={`${formatAmount(holding.amount)} ${holding.symbol}`}
                  value={formatCurrency(holding.fiat, currency)}
                />
              ))}
          </Fragment>
        )
      })}
    </>
  )
}

export default AssetsGroups
