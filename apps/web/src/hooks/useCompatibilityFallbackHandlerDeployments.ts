import { getCompatibilityFallbackHandlerDeployments } from '@safe-global/safe-deployments'
import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook to get the compatibility fallback handler deployments for the current Safe version
 * @returns The compatibility fallback handler deployments or undefined if the Safe version is not set
 */
export const useCompatibilityFallbackHandlerDeployments = () => {
  const { safe } = useSafeInfo()

  return useMemo(() => {
    if (!safe.version) return undefined
    return getCompatibilityFallbackHandlerDeployments({ version: safe.version })
  }, [safe.version])
}
