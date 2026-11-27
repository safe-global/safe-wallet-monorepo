import { Fragment, type ReactElement } from 'react'
import { Coins, Layers } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { formatAmount, formatCurrency } from '@safe-global/utils/utils/formatNumber'
import AssetLogo from '@safe-global/views/features/spaces/components/SpaceAssets/AssetLogo'
import { AssetHoldingRow, AssetsGroupRow } from '@safe-global/views/features/spaces/components/SpaceAssets/AssetsRows'
import SignersList from '@safe-global/views/features/spaces/components/SpaceQueue/SignersList'
import { FiatChange } from '@safe-global/views/components/balances/AssetsTable/FiatChange'
import FiatValue from '@/components/common/FiatValue'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { toChainInfos } from '../../utils'
import type { HoldingsGroup, HoldingsRow } from './utils'

const GROUP_LABELS = { tokens: 'Tokens', positions: 'Positions' } as const

type AssetsGroupsProps = {
  groups: HoldingsGroup[]
  isCollapsed: (id: string) => boolean
  onToggle: (id: string) => void
}

/** A band for tokens and one for positions, then a row per asset with the Safes holding it on hover */
const AssetsGroups = ({ groups, isCollapsed, onToggle }: AssetsGroupsProps): ReactElement => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const getName = useSafeNameResolver()
  const chainsOf = (chainIds: string[]) => toChainInfos(chainIds, configs)

  const subtitleOf = (row: HoldingsRow) =>
    [row.symbol, row.protocol, row.type === 'Token' ? undefined : row.type].filter(Boolean).join(' · ')

  const ownersOf = (row: HoldingsRow) => (
    <SignersList
      header={`Held by ${row.safes.length} Safe ${row.safes.length === 1 ? 'account' : 'accounts'}`}
      isLoading={false}
      hideStatus
      signers={row.safes.map((share) => ({
        address: share.safeAddress,
        signed: true,
        name: [
          getName(share.safeAddress, share.chainIds[0]) || shortenAddress(share.safeAddress),
          `${formatAmount(share.amount)} ${row.symbol}`,
          formatCurrency(share.fiat, currency),
        ].join(' · '),
      }))}
    />
  )

  return (
    <>
      {groups.map((group) => {
        const collapsed = isCollapsed(group.id)
        return (
          <Fragment key={group.id}>
            <AssetsGroupRow
              logo={
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {group.id === 'positions' ? <Layers className="size-4" /> : <Coins className="size-4" />}
                </span>
              }
              title={GROUP_LABELS[group.id]}
              chains={chainsOf(group.chainIds)}
              value={<FiatValue value={group.fiat} precise />}
              collapsed={collapsed}
              onToggle={() => onToggle(group.id)}
            />
            {!collapsed &&
              group.rows.map((row) => (
                <AssetHoldingRow
                  key={row.id}
                  logo={<AssetLogo src={row.logoUri} label={row.symbol} />}
                  title={row.name}
                  subtitle={subtitleOf(row)}
                  chains={chainsOf(row.chainIds)}
                  balance={`${formatAmount(row.amount)} ${row.symbol}`}
                  value={<FiatValue value={row.fiat} precise />}
                  change={row.change === undefined ? undefined : <FiatChange change={String(row.change)} inline />}
                  owners={ownersOf(row)}
                  ownersLabel={`${row.name}: held by ${row.safes.length} Safe ${row.safes.length === 1 ? 'account' : 'accounts'}`}
                />
              ))}
          </Fragment>
        )
      })}
    </>
  )
}

export default AssetsGroups
