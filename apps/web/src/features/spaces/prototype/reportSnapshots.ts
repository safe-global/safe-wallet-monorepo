import type { SampleAsset, SampleMonth, SampleSafe } from './sampleData'

export type Holding = {
  safeName: string
  safeAddress: string
  network: string
  chainId: number
  type: SampleAsset['type']
  protocol: string
  symbol: string
  name: string
  tokenAddress: string
  quantity: number
  priceUsd: number
  valueUsd: number
}

export type Snapshot = {
  month: SampleMonth
  safes: SampleSafe[]
  unreadAddresses: string[]
  holdings: Holding[]
}

export type GroupTotal = { key: string; holding: Holding; quantity: number; valueUsd: number }

// Sample quantities move a few percent per month so the change column has something to show.
const quantityAt = (safeIndex: number, safe: SampleSafe, chainId: number, asset: SampleAsset, step: number): number => {
  if (safe.isStatic) return asset.quantity
  const drift = ((safeIndex * 7 + chainId + asset.symbol.length * 3 + step * 5) % 7) - 3
  return Number((asset.quantity * (1 + 0.03 * drift)).toFixed(4))
}

export const buildSnapshot = (month: SampleMonth, safes: SampleSafe[], unreadSafeName?: string): Snapshot => {
  const unread = safes.filter((safe) => safe.name === unreadSafeName)
  const holdings = safes.flatMap((safe, safeIndex) =>
    unread.includes(safe)
      ? []
      : safe.chains.flatMap((chain) =>
          chain.assets.map((asset): Holding => {
            const quantity = quantityAt(safeIndex, safe, chain.chainId, asset, month.step)
            const priceUsd = asset.priceUsd === 1 ? 1 : Number((asset.priceUsd * month.priceScale).toFixed(2))
            return {
              safeName: safe.name,
              safeAddress: safe.address,
              network: chain.name,
              chainId: chain.chainId,
              type: asset.type,
              protocol: asset.protocol,
              symbol: asset.symbol,
              name: asset.name,
              tokenAddress: asset.tokenAddress,
              quantity,
              priceUsd,
              valueUsd: Number((quantity * priceUsd).toFixed(2)),
            }
          }),
        ),
  )
  return { month, safes, unreadAddresses: unread.map((safe) => safe.address), holdings }
}

export const totalUsd = (snapshot: Snapshot): number =>
  snapshot.holdings.reduce((sum, holding) => sum + holding.valueUsd, 0)

export const safeKey = (holding: Holding): string => holding.safeAddress
export const assetKey = (holding: Holding): string => `${holding.symbol}|${holding.type}|${holding.protocol}`

export const groupTotals = (snapshot: Snapshot, keyOf: (holding: Holding) => string): GroupTotal[] => {
  const groups = new Map<string, GroupTotal>()
  for (const holding of snapshot.holdings) {
    const key = keyOf(holding)
    const group = groups.get(key) ?? { key, holding, quantity: 0, valueUsd: 0 }
    group.quantity += holding.quantity
    group.valueUsd += holding.valueUsd
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.valueUsd - a.valueUsd)
}

/** Two dates compare only when every Safe account was read on both. */
export const isComparable = (current: Snapshot, previous?: Snapshot): previous is Snapshot =>
  previous !== undefined && current.unreadAddresses.length === 0 && previous.unreadAddresses.length === 0
