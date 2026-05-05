import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'

/**
 * Returns true if the current Safe is a Gnosis Pay safe, regardless of whether
 * the connected wallet has permission to act on its Delay queue. Use this to
 * gate UI visibility (banner, queue list, action slot). Use
 * `useIsGnosisPayOwner` instead to gate write actions.
 */
export const useIsGnosisPaySafe = (): AsyncResult<boolean> => {
  const [delayModule, error, loading] = useGnosisPayDelayModule()
  return [Boolean(delayModule), error, loading]
}
