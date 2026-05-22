import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { isGnosisPayDelayModifier } from '../utils/isGnosisPayDelayModifier'

/**
 * Detects whether the current Safe has a Gnosis Pay Delay modifier proxy
 * enabled as a module. Independent of the connected wallet — purely a
 * "is this a Gnosis Pay safe?" check.
 *
 * Pass `enabled: false` from call sites that don't actually need the answer
 * (e.g. CheckWallet without `allowGnosisPaySafe`) to avoid the per-module
 * `eth_getCode` RPC fan-out on chain 100.
 */
export const useGnosisPayDelayModule = ({ enabled = true }: { enabled?: boolean } = {}): AsyncResult<
  AddressInfo | undefined
> => {
  const chainId = useChainId()
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe } = useSafeInfo()

  return useAsync(async () => {
    if (!enabled || !web3ReadOnly || !safe.modules) {
      return undefined
    }
    const delayModuleMap = await Promise.all(
      safe.modules.map((module) => isGnosisPayDelayModifier(chainId, module.value, web3ReadOnly)),
    )
    const idx = delayModuleMap.findIndex((v) => v)
    return idx >= 0 ? safe.modules[idx] : undefined
  }, [enabled, chainId, safe.modules, web3ReadOnly])
}
