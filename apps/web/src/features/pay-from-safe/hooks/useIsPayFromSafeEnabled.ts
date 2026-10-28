import { useCurrentChain } from '@/hooks/useChains'
import { isPayFromSafeAvailable } from '../utils/isPayFromSafeAvailable'

/**
 * Whether the current chain offers Pay from Safe: its relayer lists `PAY_FROM_SAFE` in
 * `gasPaymentOptions`. That option alone switches the UI on (the fee card, the info banner, the
 * gas-aware Max in token transfers, the signer-paid history breakdown and the gas payment source in
 * analytics); there is no separate feature flag. It is also what the CGW requires to relay a
 * transaction that refunds the relayer from the Safe.
 *
 * @returns `true` when offered, `false` when not, `undefined` while the chain is unknown.
 */
export const useIsPayFromSafeEnabled = (): boolean | undefined => {
  const chain = useCurrentChain()
  if (!chain) return undefined
  return isPayFromSafeAvailable(chain)
}
