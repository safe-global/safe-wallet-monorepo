import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { calculatePositionsFiatTotal, getReadablePositionType } from '@safe-global/utils/features/positions'
import type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import type {
  AssetProtocolRow,
  AssetTokenRow,
  ChainAssetsState,
} from '@safe-global/views/features/spaces/components/SpaceAssets/types'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'

/** A Space Safe address and the networks it is on, in the Space's sort order */
export type AssetsSafe = { address: string; chainIds: string[] }

export type AssetsFilters = { safes: string[]; chainIds: string[] }

export const NO_ASSETS_FILTERS: AssetsFilters = { safes: [], chainIds: [] }

export type AssetsSummary = { tokens: number; positions: number }

export type ChainAssetsReport = {
  state: ChainAssetsState | 'pending'
  summary?: AssetsSummary
  /** Loaded, but some of its assets failed and are left out */
  isPartial?: boolean
}

const isFailed = (report: ChainAssetsReport | undefined): boolean =>
  !!report && (report.state === 'error' || report.state === 'unsupported' || !!report.isPartial)

export const toAssetsKey = (chainId: string, address: string): string => `${chainId}:${address.toLowerCase()}`

export const toAssetsSafes = (safeItems: Pick<SafeItem, 'chainId' | 'address'>[]): AssetsSafe[] => {
  const byAddress = new Map<string, AssetsSafe>()
  for (const { chainId, address } of safeItems) {
    const key = address.toLowerCase()
    const safe = byAddress.get(key) ?? { address, chainIds: [] }
    if (!safe.chainIds.includes(chainId)) safe.chainIds.push(chainId)
    byAddress.set(key, safe)
  }
  return [...byAddress.values()]
}

export const hasAssetsFilters = (filters: AssetsFilters): boolean =>
  filters.safes.length > 0 || filters.chainIds.length > 0

export const filterAssetsSafes = (safes: AssetsSafe[], filters: AssetsFilters): AssetsSafe[] =>
  safes
    .filter(({ address }) => filters.safes.length === 0 || filters.safes.some((safe) => sameAddress(safe, address)))
    .map((safe) =>
      filters.chainIds.length === 0
        ? safe
        : { ...safe, chainIds: safe.chainIds.filter((chainId) => filters.chainIds.includes(chainId)) },
    )
    .filter(({ chainIds }) => chainIds.length > 0)

const toNumber = (value: string | undefined): number => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

/** Tokens and positions are summed apart, so the total always matches the rows shown */
export const toAssetsSummary = (balances: PortfolioBalances | undefined, protocols?: Protocol[]): AssetsSummary => ({
  tokens: toNumber(balances?.tokensFiatTotal ?? balances?.fiatTotal),
  positions: calculatePositionsFiatTotal(protocols),
})

export const sumAssetsSummaries = (summaries: AssetsSummary[]): AssetsSummary =>
  summaries.reduce(
    (sum, { tokens, positions }) => ({ tokens: sum.tokens + tokens, positions: sum.positions + positions }),
    { tokens: 0, positions: 0 },
  )

/** How the reports of the shown networks add up: loaded ones count, failed ones are left out */
export const aggregateReports = (reports: (ChainAssetsReport | undefined)[]) => {
  const loaded = reports.flatMap((report) => (report?.summary ? [report.summary] : []))
  return {
    summary: sumAssetsSummaries(loaded),
    isLoading: reports.some((report) => !report || report.state === 'pending' || report.state === 'loading'),
    isPartial: reports.some(isFailed),
    hasSummary: loaded.length > 0,
  }
}

export const toTokenRows = (items: Balances['items'], currency: string): AssetTokenRow[] =>
  items
    .filter((item) => item.balance !== '0')
    .sort((a, b) => toNumber(b.fiatBalance) - toNumber(a.fiatBalance))
    .map((item) => ({
      id: item.tokenInfo.address,
      name: item.tokenInfo.name,
      symbol: item.tokenInfo.symbol,
      logoUri: item.tokenInfo.logoUri || undefined,
      amount: formatVisualAmount(item.balance, item.tokenInfo.decimals),
      value: formatCurrency(item.fiatBalance, currency),
    }))

export const toProtocolRows = (protocols: Protocol[], currency: string): AssetProtocolRow[] =>
  [...protocols]
    .sort((a, b) => toNumber(b.fiatTotal) - toNumber(a.fiatTotal))
    .map((protocol) => ({
      id: protocol.protocol,
      name: protocol.protocol_metadata.name,
      logoUri: protocol.protocol_metadata.icon.url,
      value: formatCurrency(protocol.fiatTotal, currency),
      positions: protocol.items.flatMap((group, groupIndex) =>
        group.items.map((position, index) => ({
          id: `${groupIndex}:${index}:${position.tokenInfo.address}`,
          name: position.tokenInfo.name,
          type: getReadablePositionType(position.position_type),
          amount: `${formatVisualAmount(position.balance, position.tokenInfo.decimals)} ${position.tokenInfo.symbol}`,
          value: formatCurrency(position.fiatBalance, currency),
        })),
      ),
    }))
