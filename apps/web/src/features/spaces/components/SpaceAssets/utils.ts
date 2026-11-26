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

/** Holdings summed across the Safes, and across the networks when grouped by Safe, so an asset shows once per band */
export type HoldingsRow = {
  id: string
  assetKey: string
  name: string
  symbol: string
  logoUri?: string
  type: string
  protocol?: string
  chainIds: string[]
  safeAddresses: string[]
  amount: number
  fiat: number
}

export type HoldingsGroup = {
  id: string
  /** The asset key, the Safe address or the chain id */
  key: string
  rows: HoldingsRow[]
  chainIds: string[]
  amount: number
  fiat: number
}

const GROUP_KEYS: Record<AssetsGroupBy, (holding: AssetHolding) => string> = {
  asset: (holding) => holding.assetKey,
  type: (holding) => (holding.isPosition ? 'positions' : 'tokens'),
  safe: (holding) => holding.safeAddress.toLowerCase(),
  network: (holding) => holding.chainId,
}

// Tokens before positions, as in the totals, whatever their values
const GROUP_ORDER: Partial<Record<AssetsGroupBy, string[]>> = { type: ['tokens', 'positions'] }

// Tokens and each kind of position stay apart, so staked ETH isn't summed into the wallet's ETH
const ROW_KEYS: Record<AssetsGroupBy, (holding: AssetHolding) => string> = {
  asset: (holding) => [holding.chainId, holding.type, holding.protocol ?? ''].join('|'),
  type: (holding) => [holding.assetKey, holding.type, holding.protocol ?? ''].join('|'),
  safe: (holding) => [holding.assetKey, holding.type, holding.protocol ?? ''].join('|'),
  network: (holding) => [holding.assetKey, holding.type, holding.protocol ?? ''].join('|'),
}

const byKey = <T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> => {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    map.set(key, [...(map.get(key) ?? []), item])
  }
  return map
}

const sum = (items: AssetHolding[], field: 'amount' | 'fiat') => items.reduce((total, item) => total + item[field], 0)

const unique = (values: string[]) => [...new Set(values)]

const toRow = (id: string, items: AssetHolding[]): HoldingsRow => {
  const [first] = items
  return {
    id,
    assetKey: first.assetKey,
    name: first.name,
    symbol: first.symbol,
    logoUri: items.find((item) => item.logoUri)?.logoUri,
    type: first.type,
    protocol: first.protocol,
    chainIds: unique(items.map((item) => item.chainId)),
    safeAddresses: unique(items.map((item) => item.safeAddress.toLowerCase())),
    amount: sum(items, 'amount'),
    fiat: sum(items, 'fiat'),
  }
}

/** Groups the holdings and sums each group's rows, each group and its rows highest value first */
export const groupHoldings = (holdings: AssetHolding[], groupBy: AssetsGroupBy): HoldingsGroup[] =>
  [...byKey(holdings, GROUP_KEYS[groupBy]).entries()]
    .map(([key, items]) => {
      const id = `${groupBy}:${key}`
      return {
        id,
        key,
        rows: [...byKey(items, ROW_KEYS[groupBy]).entries()]
          .map(([rowKey, rowItems]) => toRow(`${id}:${rowKey}`, rowItems))
          .sort((a, b) => b.fiat - a.fiat),
        chainIds: unique(items.map((item) => item.chainId)),
        amount: sum(items, 'amount'),
        fiat: sum(items, 'fiat'),
      }
    })
    .sort((a, b) => {
      const order = GROUP_ORDER[groupBy]
      return order ? order.indexOf(a.key) - order.indexOf(b.key) : b.fiat - a.fiat
    })
