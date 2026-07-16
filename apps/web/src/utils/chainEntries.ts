import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Drop entries on chains that are no longer in the supported chains list.
 * Read-time filter for persisted, chainId-keyed slices — does not mutate the source object
 * or localStorage. See #2585.
 */
export const pickSupportedChainEntries = <T>(
  byChainId: Record<string, T> | undefined,
  chains: ReadonlyArray<Pick<Chain, 'chainId'>>,
): Record<string, T> => {
  if (!byChainId) return {}
  const supported = new Set(chains.map((c) => c.chainId))
  return Object.keys(byChainId).reduce<Record<string, T>>((acc, chainId) => {
    if (supported.has(chainId)) acc[chainId] = byChainId[chainId]
    return acc
  }, {})
}
