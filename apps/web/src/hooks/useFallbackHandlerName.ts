import { useMemo } from 'react'
import {
  getCompatibilityFallbackHandlerDeployments,
  getExtensibleFallbackHandlerDeployments,
} from '@safe-global/safe-deployments'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { hasMatchingDeployment, TRUSTED_DEPLOYMENT_VERSIONS } from '@safe-global/utils/services/contracts/deployments'

/**
 * Hook to get the official deployment name of the current Safe's fallback handler,
 * verified against the handler address on the current chain.
 * @returns The contract name of the matching official deployment, or undefined if the
 * address matches no known deployment (so unknown handlers are not mislabelled)
 */
export const useFallbackHandlerName = (): string | undefined => {
  const { safe } = useSafeInfo()
  const twapFallbackHandler = useTWAPFallbackHandlerAddress()
  const address = safe.fallbackHandler?.value
  const chainId = safe.chainId

  return useMemo(() => {
    if (!address) return undefined

    if (
      hasMatchingDeployment(getCompatibilityFallbackHandlerDeployments, address, chainId, TRUSTED_DEPLOYMENT_VERSIONS)
    ) {
      return 'CompatibilityFallbackHandler'
    }

    // CoW's TWAP handler is CoW's own instance of the ExtensibleFallbackHandler
    if (
      hasMatchingDeployment(getExtensibleFallbackHandlerDeployments, address, chainId, TRUSTED_DEPLOYMENT_VERSIONS) ||
      sameAddress(address, twapFallbackHandler)
    ) {
      return 'ExtensibleFallbackHandler'
    }

    return undefined
  }, [address, chainId, twapFallbackHandler])
}
