import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Case-insensitive substring match of a search query against a network's display name.
 * An empty or whitespace-only query matches everything, so callers can filter unconditionally.
 */
export const matchesNetworkSearch = (chain: Pick<Chain, 'chainName'>, query: string): boolean => {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return chain.chainName.toLowerCase().includes(normalizedQuery)
}
