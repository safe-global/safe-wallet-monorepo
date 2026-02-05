import { useMemo } from 'react'
import { useAllSafesGrouped } from '@/hooks/safes'
import useChains from '@/hooks/useChains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Hook to get all networks where a specific Safe is active
 *
 * @param safeAddress - The address of the Safe to check
 * @returns Array of network names where the Safe is deployed
 */
export const useNetworksOfSafe = (safeAddress: string): string[] => {
  const { allMultiChainSafes } = useAllSafesGrouped()
  const { configs: allChains } = useChains()

  const chainMap = useMemo(() => {
    return allChains.reduce(
      (acc, chain) => {
        acc[chain.chainId] = chain
        return acc
      },
      {} as Record<string, Chain>,
    )
  }, [allChains])

  return useMemo(() => {
    if (!safeAddress || !allMultiChainSafes) {
      return []
    }

    const multiChainSafe = allMultiChainSafes.find((multiSafe) => sameAddress(multiSafe.address, safeAddress))

    if (!multiChainSafe) {
      return []
    }

    const chainIds = multiChainSafe.safes.map((safeItem) => safeItem.chainId)

    const networkNames = chainIds.map((chainId) => {
      const chainInfo = chainMap[chainId]
      return chainInfo?.chainName || 'unknown'
    })

    return networkNames
  }, [safeAddress, allMultiChainSafes, chainMap])
}
