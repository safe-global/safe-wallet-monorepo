import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { isHypernativeGuard } from '../services/hypernativeGuardCheck'

export type HypernativeGuardCheckResult = {
  isHypernativeGuard: boolean
  loading: boolean
}

/**
 * Hook to check if the current Safe has a HypernativeGuard installed
 *
 * @returns HypernativeGuardCheckResult with isHypernativeGuard flag and loading state
 */
export const useIsHypernativeGuard = (): HypernativeGuardCheckResult => {
  const { safe, safeLoaded } = useSafeInfo()
  const web3ReadOnly = useWeb3ReadOnly()

  const [isHnGuard, error, loading] = useAsync<boolean>(
    () => {
      // Don't check if Safe is not loaded yet or if there's no provider
      if (!safeLoaded || !web3ReadOnly) {
        return
      }

      // If there's no guard, we know it's not a HypernativeGuard
      if (!safe.guard) {
        return Promise.resolve(false)
      }

      // Check if the guard is a HypernativeGuard
      return isHypernativeGuard(safe.guard.value, web3ReadOnly)
    },
    [safe.guard, safeLoaded, web3ReadOnly],
    false, // Don't clear data on re-fetch to avoid flickering
  )

  // Log errors for debugging
  if (error) {
    console.error('[useIsHypernativeGuard] Error checking guard:', error)
  }

  return {
    isHypernativeGuard: isHnGuard ?? false,
    loading: !safeLoaded || (safeLoaded && !web3ReadOnly) || loading,
  }
}
