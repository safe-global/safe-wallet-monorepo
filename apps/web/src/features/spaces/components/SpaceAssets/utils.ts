import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { getReadablePositionType } from '@safe-global/utils/features/positions'
import type { PortfolioBalances } from '@safe-global/utils/hooks/portfolioBalances'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
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
  /** The 24h price change, in the unit the gateway sends */
  change?: number
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

const toChange = (value: string | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
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
      change: toChange(item.fiatBalance24hChange),
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
        change: toChange(position.fiatBalance24hChange),
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

/** What one Safe holds of a row's asset, across its networks */
type SafeShare = { safeAddress: string; chainIds: string[]; amount: number; fiat: number }

/** An asset summed across the Safes and networks that hold it */
export type HoldingsRow = {
  id: string
  assetKey: string
  name: string
  symbol: string
  logoUri?: string
  type: string
  protocol?: string
  chainIds: string[]
  /** Highest value first */
  safes: SafeShare[]
  amount: number
  fiat: number
  /** The 24h change of its holdings, weighted by their value; undefined when none has one */
  change?: number
}

export type HoldingsGroup = {
  id: 'tokens' | 'positions'
  rows: HoldingsRow[]
  chainIds: string[]
  fiat: number
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

const toSafeShares = (items: AssetHolding[]): SafeShare[] =>
  [...byKey(items, (item) => item.safeAddress.toLowerCase()).values()]
    .map((safeItems) => ({
      safeAddress: safeItems[0].safeAddress,
      chainIds: unique(safeItems.map((item) => item.chainId)),
      amount: sum(safeItems, 'amount'),
      fiat: sum(safeItems, 'fiat'),
    }))
    .sort((a, b) => b.fiat - a.fiat)

const weightedChange = (items: AssetHolding[]): number | undefined => {
  const withChange = items.filter((item) => item.change !== undefined)
  const weight = withChange.reduce((total, item) => total + Math.abs(item.fiat), 0)
  if (withChange.length === 0) return undefined
  if (weight === 0) return withChange[0].change
  return withChange.reduce((total, item) => total + (item.change ?? 0) * Math.abs(item.fiat), 0) / weight
}

const toRow = (id: string, items: AssetHolding[]): HoldingsRow => {
  const [first] = [...items].sort((a, b) => b.fiat - a.fiat)
  return {
    id,
    assetKey: first.assetKey,
    name: first.name,
    symbol: first.symbol,
    logoUri: first.logoUri ?? items.find((item) => item.logoUri)?.logoUri,
    type: first.type,
    protocol: first.protocol,
    chainIds: unique(items.map((item) => item.chainId)),
    safes: toSafeShares(items),
    amount: sum(items, 'amount'),
    fiat: sum(items, 'fiat'),
    change: weightedChange(items),
  }
}

// Tokens and each kind of position stay apart, so staked ETH isn't summed into the wallet's ETH
const rowKey = (holding: AssetHolding) => [holding.assetKey, holding.type, holding.protocol ?? ''].join('|')

/** Tokens, then positions, each asset summed across Safes and networks, highest value first */
export const groupHoldings = (holdings: AssetHolding[]): HoldingsGroup[] =>
  (['tokens', 'positions'] as const)
    .map((id) => {
      const items = holdings.filter((holding) => holding.isPosition === (id === 'positions'))
      return {
        id,
        rows: [...byKey(items, rowKey).entries()]
          .map(([key, rowItems]) => toRow(`${id}:${key}`, rowItems))
          .sort((a, b) => b.fiat - a.fiat),
        chainIds: unique(items.map((item) => item.chainId)),
        fiat: sum(items, 'fiat'),
      }
    })
    .filter((group) => group.rows.length > 0)
