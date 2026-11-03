import { useCurrentChain } from '@/hooks/useChains'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'

/** `PAY_FROM_SAFE` in the chain's relayer options (no feature flag); undefined while the chain is unknown. */
export const useIsPayFromSafeEnabled = (): boolean | undefined => {
  const chain = useCurrentChain()
  if (!chain) return undefined
  return isPayFromSafeAvailable(chain)
}
