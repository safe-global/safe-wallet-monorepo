import { useCallback, useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useTWAPFallbackHandlerAddress } from '@/features/swap'
import { identifyOfficialFallbackHandler } from '@safe-global/utils/services/contracts/deployments'

/**
 * Hook to check if the Safe's fallback handler (or optionally provided addresses) contain a non-official one.
 * Official handlers are the CompatibilityFallbackHandler and ExtensibleFallbackHandler deployments,
 * plus CoW's TWAP handler on its supported chains.
 * @param fallbackHandler Optional fallback handler address(es) (if not provided, it will be taken from the Safe info)
 * @returns Boolean indicating if an untrusted fallback handler is set or if the provided address(es) contain an untrusted one
 */
export const useHasUntrustedFallbackHandler = (fallbackHandler?: string | string[]) => {
  const { safe } = useSafeInfo()
  const twapFallbackHandler = useTWAPFallbackHandlerAddress()

  const fallbackHandlerAddresses = useMemo(() => {
    if (!fallbackHandler) {
      return safe.fallbackHandler?.value ? [safe.fallbackHandler?.value] : []
    }

    return Array.isArray(fallbackHandler) ? fallbackHandler : [fallbackHandler]
  }, [fallbackHandler, safe.fallbackHandler?.value])

  const isFallbackHandlerUntrusted = useCallback(
    (fallbackHandlerAddress: string) => {
      return (
        !sameAddress(fallbackHandlerAddress, twapFallbackHandler) &&
        !identifyOfficialFallbackHandler(fallbackHandlerAddress, safe.chainId)
      )
    },
    [safe.chainId, twapFallbackHandler],
  )

  return useMemo(
    () => fallbackHandlerAddresses.length > 0 && fallbackHandlerAddresses.some(isFallbackHandlerUntrusted),
    [fallbackHandlerAddresses, isFallbackHandlerUntrusted],
  )
}
