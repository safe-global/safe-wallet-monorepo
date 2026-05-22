import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'

/**
 * Returns true if the current Safe is a Gnosis Pay safe, regardless of whether
 * the connected wallet has permission to act on its Delay queue. Use this to
 * gate UI visibility (banner, queue list, action slot). Use
 * `useIsGnosisPayOwner` instead to gate write actions.
 *
 * Pass `enabled: false` from hot call sites (e.g. CheckWallet) that don't
 * actually need the answer to skip the underlying RPC fan-out.
 */
export const useIsGnosisPaySafe = ({ enabled = true }: { enabled?: boolean } = {}): AsyncResult<boolean> => {
  const [delayModule, error, loading] = useGnosisPayDelayModule({ enabled })
  return [Boolean(delayModule), error, loading]
}
