import { useMemo } from 'react'
import useChains from '@/hooks/useChains'

/**
 * Chain ids of every chain the config service currently supports, memoised on the chain list.
 *
 * Workspace address book entries apply to every network, so writers send this list as `chainIds`
 * and the read path stamps it onto each stored entry. Empty while the chain config is loading or
 * failed; callers treat that as "unknown" and hold the write.
 */
export const useAllChainIds = (): string[] => {
  const { configs } = useChains()
  return useMemo(() => configs.map((chain) => chain.chainId), [configs])
}
