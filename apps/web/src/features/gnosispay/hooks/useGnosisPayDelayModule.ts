import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
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
  const hasFeature = useHasFeature(FEATURES.GNOSIS_PAY)
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe } = useSafeInfo()

  const isActivated =
    safe.owners.length === 1 && sameAddress(safe.owners[0].value, '0x0000000000000000000000000000000000000002')

  const result = useAsync(async () => {
    if (!enabled || !hasFeature || !isActivated || !web3ReadOnly || !safe.modules) {
      return undefined
    }
    const delayModuleMap = await Promise.all(
      safe.modules.map((module) => isGnosisPayDelayModifier(module.value, web3ReadOnly)),
    )
    const idx = delayModuleMap.findIndex((v) => v)
    return idx >= 0 ? safe.modules[idx] : undefined
  }, [enabled, hasFeature, isActivated, safe.modules, web3ReadOnly])
  return enabled && hasFeature && isActivated ? result : [undefined, undefined, false]
}
