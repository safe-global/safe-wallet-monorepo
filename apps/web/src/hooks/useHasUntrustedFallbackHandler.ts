import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCompatibilityFallbackHandlerDeployments } from '@/hooks/useCompatibilityFallbackHandlerDeployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useTWAPFallbackHandlerAddress } from '@/features/swap/hooks/useIsTWAPFallbackHandler'

/**
 * Hook to check if the Safe's fallback handler (or optionally provided addresses) contain a non-official one.
 * @param fallbackHandler Optional fallback handler address(es) (if not provided, it will be taken from the Safe info)
 * @returns Boolean indicating if an untrusted fallback handler is set or if the provided address(es) contain an untrusted one
 */
export const useHasUntrustedFallbackHandler = (fallbackHandler?: string | string[]) => {
  const fallbackHandlerDeployments = useCompatibilityFallbackHandlerDeployments()
  const { safe } = useSafeInfo()
  const twapFallbackHandler = useTWAPFallbackHandlerAddress()

  const fallbackHandlerAddresses = useMemo(() => {
    if (!fallbackHandler) {
      return safe.fallbackHandler?.value ? [safe.fallbackHandler?.value] : []
    }

    return Array.isArray(fallbackHandler) ? fallbackHandler : [fallbackHandler]
  }, [fallbackHandler, safe.fallbackHandler?.value])

  const officialFallbackHandlerAddresses = useMemo(() => {
    const addresses = !!twapFallbackHandler ? [twapFallbackHandler] : []
    const officialAddresses = fallbackHandlerDeployments?.networkAddresses[safe.chainId]

    if (!officialAddresses) {
      return addresses
    }

    return [...addresses, ...(Array.isArray(officialAddresses) ? officialAddresses : [officialAddresses])]
  }, [fallbackHandlerDeployments, safe.chainId, twapFallbackHandler])

  return useMemo(
    () =>
      fallbackHandlerAddresses.length > 0 &&
      fallbackHandlerAddresses.some(
        (fallbackHandlerAddress) =>
          !!fallbackHandlerAddress &&
          !officialFallbackHandlerAddresses.some((address) => sameAddress(address, fallbackHandlerAddress)),
      ),
    [fallbackHandlerAddresses, officialFallbackHandlerAddresses],
  )
}
