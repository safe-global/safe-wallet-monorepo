import { type AllSafeItems, isMultiChainSafeItem } from './useAllSafesGrouped'

/**
 * Stable key identifying a row in the accounts list, used to persist the user's manual order.
 * Multi-chain groups are keyed by address; single-chain items by chainId:address.
 */
export const getSafeItemKey = (item: AllSafeItems[number]): string =>
  isMultiChainSafeItem(item) ? `multi:${item.address.toLowerCase()}` : `${item.chainId}:${item.address.toLowerCase()}`

/**
 * Reorders `items` to match the user's saved key order.
 * Items present in `order` come first, in that order; any items not in `order`
 * (e.g. newly added accounts) keep their existing relative order and are appended.
 */
export const applyCustomOrder = (items: AllSafeItems, order: string[]): AllSafeItems => {
  const rank = new Map(order.map((key, index) => [key, index]))
  const known: AllSafeItems = []
  const unknown: AllSafeItems = []

  for (const item of items) {
    ;(rank.has(getSafeItemKey(item)) ? known : unknown).push(item)
  }

  known.sort((a, b) => (rank.get(getSafeItemKey(a)) ?? 0) - (rank.get(getSafeItemKey(b)) ?? 0))

  return [...known, ...unknown]
}
