import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { identifyOfficialFallbackHandler } from '@safe-global/utils/services/contracts/deployments'

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

    const officialHandler = identifyOfficialFallbackHandler(address, chainId)
    if (officialHandler === 'compatibility') {
      return 'CompatibilityFallbackHandler'
    }

    if (officialHandler === 'extensible') {
      return 'ExtensibleFallbackHandler'
    }

    // CoW's TWAP handler is CoW's own instance of the ExtensibleFallbackHandler; label it
    // distinctly so replacing the official one with it is visible in the UI
    if (sameAddress(address, twapFallbackHandler)) {
      return 'ExtensibleFallbackHandler (CoW Swap)'
    }

    return undefined
  }, [address, chainId, twapFallbackHandler])
}
