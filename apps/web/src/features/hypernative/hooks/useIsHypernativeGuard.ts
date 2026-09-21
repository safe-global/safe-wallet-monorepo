import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import useSafeInfo from '@/hooks/useSafeInfo'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
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
  const skipAbiCheck = useHasFeature(FEATURES.HYPERNATIVE_RELAX_GUARD_CHECK)

  const [isHnGuard, , loading] = useAsync<boolean>(
    async () => {
      // Don't check if Safe is not loaded yet or if there's no provider
      // Return false instead of undefined to clear previous cached values
      if (!safeLoaded || !web3ReadOnly) {
        return false
      }

      // If there's no guard, we know it's not a HypernativeGuard
      if (!safe.guard) {
        return false
      }

      try {
        // Check if the guard is a HypernativeGuard
        // Pass the skipAbiCheck flag from the feature flag
        return await isHypernativeGuard(safe.chainId, safe.guard.value, web3ReadOnly, skipAbiCheck)
      } catch {
        // On error (e.g. RPC failure), return false but don't cache it. The
        // failure is reported once by the service layer; reporting it again
        // here would double-count it, and once per render at that — this hook
        // has several concurrent owners on a single page.
        return false
      }
    },
    [safe.chainId, safe.guard, safeLoaded, web3ReadOnly, skipAbiCheck],
    false, // Don't clear data on re-fetch to avoid flickering
  )

  return {
    isHypernativeGuard: isHnGuard ?? false,
    loading: !safeLoaded || (safeLoaded && !web3ReadOnly) || loading,
  }
}
