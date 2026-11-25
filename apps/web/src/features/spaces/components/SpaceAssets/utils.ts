import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { getReadablePositionType } from '@safe-global/utils/features/positions'
import type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import type { AssetsGroupBy } from '@safe-global/views/features/spaces/components/SpaceAssets/types'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'

/** A Space Safe address and the networks it is on, in the Space's sort order */
export type AssetsSafe = { address: string; chainIds: string[] }

export type AssetsFilters = { safes: string[]; chainIds: string[] }

export const NO_ASSETS_FILTERS: AssetsFilters = { safes: [], chainIds: [] }

export type AssetsSummary = { tokens: number; positions: number }

export type ChainAssetsState = 'pending' | 'loading' | 'error' | 'ready' | 'inactive' | 'unsupported'

/** A token or a position of one Safe on one network */
export type AssetHolding = {
  id: string
  safeAddress: string
  chainId: string
  /** What groups the same asset across Safes and networks */
  assetKey: string
  name: string
  symbol: string
  logoUri?: string
  isPosition: boolean
  /** "Token", or the position's type */
  type: string
  protocol?: string
  amount: number
  fiat: number
}

export type ChainAssetsReport = {
  state: ChainAssetsState
  holdings?: AssetHolding[]
  /** Loaded, but some of its assets failed and are left out */
  isPartial?: boolean
}

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

const toNumber = (value: string | number | undefined): number => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

const toAmount = (balance: string, decimals: number | null | undefined): number =>
  toNumber(safeFormatUnits(balance, decimals ?? 0))

export const toHoldings = (
  safeAddress: string,
  chainId: string,
  balances: PortfolioBalances | undefined,
  protocols: Protocol[] | undefined,
): AssetHolding[] => {
  const prefix = toAssetsKey(chainId, safeAddress)
  const tokens = (balances?.items ?? [])
    .filter((item) => item.balance !== '0')
    .map((item) => ({
      id: `${prefix}:token:${item.tokenInfo.address}`,
      safeAddress,
      chainId,
      assetKey: item.tokenInfo.symbol.toUpperCase(),
      name: item.tokenInfo.name,
      symbol: item.tokenInfo.symbol,
      logoUri: item.tokenInfo.logoUri || undefined,
      isPosition: false,
      type: 'Token',
      amount: toAmount(item.balance, item.tokenInfo.decimals),
      fiat: toNumber(item.fiatBalance),
    }))
  const positions = (protocols ?? []).flatMap((protocol) =>
    protocol.items.flatMap((group, groupIndex) =>
      group.items.map((position, index) => ({
        id: `${prefix}:position:${protocol.protocol}:${groupIndex}:${index}:${position.tokenInfo.address}`,
        safeAddress,
        chainId,
        assetKey: position.tokenInfo.symbol.toUpperCase(),
        name: position.tokenInfo.name,
        symbol: position.tokenInfo.symbol,
        logoUri: position.tokenInfo.logoUri || undefined,
        isPosition: true,
        type: getReadablePositionType(position.position_type),
        protocol: protocol.protocol_metadata.name,
        // A loan's balance is what is owed, so it takes away from the asset as its value does
        amount: (position.position_type === 'loan' ? -1 : 1) * toAmount(position.balance, position.tokenInfo.decimals),
        fiat: toNumber(position.fiatBalance),
      })),
    ),
  )
  return [...tokens, ...positions]
}

export const summarizeHoldings = (holdings: AssetHolding[]): AssetsSummary =>
  holdings.reduce(
    (sum, { isPosition, fiat }) =>
      isPosition ? { ...sum, positions: sum.positions + fiat } : { ...sum, tokens: sum.tokens + fiat },
    { tokens: 0, positions: 0 },
  )

/** Whether the shown networks are still loading, and whether some failed and are left out */
export const aggregateReports = (reports: (ChainAssetsReport | undefined)[]) => ({
  isLoading: reports.some((report) => !report || report.state === 'pending' || report.state === 'loading'),
  loadingCount: reports.filter((report) => !report || report.state === 'pending' || report.state === 'loading').length,
  isPartial: reports.some(
    (report) => !!report && (report.state === 'error' || report.state === 'unsupported' || !!report.isPartial),
  ),
})

/** Keeps the holdings whose asset, protocol, Safe or network contains every word of the search */
export const searchHoldings = (
  holdings: AssetHolding[],
  search: string,
  describe: (holding: AssetHolding) => string[],
): AssetHolding[] => {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return holdings
  return holdings.filter((holding) => {
    const text = [
      holding.name,
      holding.symbol,
      holding.type,
      holding.protocol ?? '',
      holding.safeAddress,
      ...describe(holding),
    ]
      .join(' ')
      .toLowerCase()
    return words.every((word) => text.includes(word))
  })
}

export type HoldingsGroup = {
  id: string
  /** The asset key, the Safe address or the chain id */
  key: string
  holdings: AssetHolding[]
  chainIds: string[]
  amount: number
  fiat: number
}

const GROUP_KEYS: Record<AssetsGroupBy, (holding: AssetHolding) => string> = {
  asset: (holding) => holding.assetKey,
  safe: (holding) => holding.safeAddress.toLowerCase(),
  network: (holding) => holding.chainId,
}

/** Groups the holdings, each group and its holdings highest value first */
export const groupHoldings = (holdings: AssetHolding[], groupBy: AssetsGroupBy): HoldingsGroup[] => {
  const groups = new Map<string, AssetHolding[]>()
  for (const holding of holdings) {
    const key = GROUP_KEYS[groupBy](holding)
    groups.set(key, [...(groups.get(key) ?? []), holding])
  }
  return [...groups.entries()]
    .map(([key, items]) => ({
      id: `${groupBy}:${key}`,
      key,
      holdings: [...items].sort((a, b) => b.fiat - a.fiat),
      chainIds: [...new Set(items.map((item) => item.chainId))],
      amount: items.reduce((sum, item) => sum + item.amount, 0),
      fiat: items.reduce((sum, item) => sum + item.fiat, 0),
    }))
    .sort((a, b) => b.fiat - a.fiat)
}
