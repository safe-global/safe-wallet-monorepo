import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useCompatibilityFallbackHandlerDeployments } from '@/hooks/useCompatibilityFallbackHandlerDeployments'

/**
 * Hook to check if the Safe's fallback handler (or optionally a provided address) is an official one.
 * @param fallbackHandler Optional fallback handler address (if not provided, it will be taken from the Safe info)
 * @returns Boolean indicating if the provided fallback handler is an official fallback handler
 */
export const useIsOfficialFallbackHandler = (fallbackHandler?: string) => {
  const fallbackHandlerDeployments = useCompatibilityFallbackHandlerDeployments()
  const { safe } = useSafeInfo()

  const fallbackHandlerAddress = fallbackHandler || safe.fallbackHandler?.value

  return useMemo(
    () =>
      !!fallbackHandlerAddress &&
      !!fallbackHandlerDeployments?.networkAddresses[safe.chainId].includes(fallbackHandlerAddress),
    [fallbackHandlerAddress, safe.chainId, fallbackHandlerDeployments],
  )
}
