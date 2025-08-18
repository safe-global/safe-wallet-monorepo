import { useEffect } from 'react'
import { analytics } from '@/services/analytics'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

/**
 * Hook to handle Safe address identification in analytics.
 * Replicates the historical behavior of identifying users by Safe address
 * and resetting context when needed.
 */
export const useSafeIdentification = () => {
  const safeAddress = useSafeAddress()
  const isSpaceRoute = useIsSpaceRoute()

  useEffect(() => {
    if (safeAddress && !isSpaceRoute) {
      // Identify user by Safe address (only when not on space routes)
      analytics.identify(safeAddress)
    }
  }, [safeAddress, isSpaceRoute])

  // Reset analytics context when Safe address changes
  // This ensures clean state when switching between Safes
  useEffect(() => {
    // Reset when safeAddress becomes null/undefined (user navigates away from Safe)
    if (!safeAddress) {
      analytics.reset()
    }
  }, [safeAddress])
}
