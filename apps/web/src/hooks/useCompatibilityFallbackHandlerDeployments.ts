import { getCompatibilityFallbackHandlerDeployments } from '@safe-global/safe-deployments'
import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCurrentChain } from '@/hooks/useChains'

/**
 * Hook to get the compatibility fallback handler deployments for the current Safe version and network
 * @returns The compatibility fallback handler deployments or undefined if the Safe version or chain is not set
 */
export const useCompatibilityFallbackHandlerDeployments = () => {
  const { safe } = useSafeInfo()
  const chain = useCurrentChain()

  return useMemo(() => {
    if (!chain?.chainId || !safe.version) return undefined
    return getCompatibilityFallbackHandlerDeployments({ network: chain?.chainId, version: safe.version })
  }, [safe.version, chain?.chainId])
}
