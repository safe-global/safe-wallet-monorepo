import { useMemo, useState } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getRecoveryDelayModifiers } from '@/features/recovery/services'
import { multicall } from '@safe-global/utils/utils/multicall'
import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'

export type SafeRecoveryConfig = {
  delayModifierAddress: string
  recoverers: string[]
  cooldownSec: bigint
  expirySec: bigint // 0 = never expires
}

/**
 * Resolves the Account Recovery (Zodiac Delay Modifier) configuration for one
 * Safe. Returns one entry per delay modifier the Safe has installed.
 *
 * Wrapped in a try/catch: a flaky RPC or a single bad sub-call returns `[]`
 * instead of throwing, so the Active Policies list never collapses into an
 * error block.
 */
export const useSafeRecovery = (chainId: string, safeAddress: string) => {
  const { configs: chains } = useChains()
  const chain = useMemo(() => chains.find((c) => c.chainId === chainId), [chains, chainId])
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const moduleCount = safeInfo?.modules?.length ?? 0
  const modulesReady = !!safeInfo && safeInfo.modules !== null

  const [asyncAttempted, setAsyncAttempted] = useState(false)

  const [configs] = useAsync<SafeRecoveryConfig[] | undefined>(
    async () => {
      // Wait for the prerequisites before marking the scan attempted, so the
      // parent's "scanning…" state stays true until we genuinely tried.
      if (!provider || !modulesReady || !safeInfo?.modules || safeInfo.modules.length === 0) return undefined

      try {
        const delayModifiers = await getRecoveryDelayModifiers(chainId, safeInfo.modules, provider)
        if (delayModifiers.length === 0) {
          setAsyncAttempted(true)
          return []
        }

        const results: SafeRecoveryConfig[] = []
        for (const dm of delayModifiers) {
          try {
            const addr = await dm.getAddress()
            const calls = [
              { to: addr, data: dm.interface.encodeFunctionData('getModulesPaginated', [SENTINEL_ADDRESS, 100]) },
              { to: addr, data: dm.interface.encodeFunctionData('txCooldown') },
              { to: addr, data: dm.interface.encodeFunctionData('txExpiration') },
            ]
            const callResults = await multicall(provider, calls)
            // Skip this modifier if any sub-call reverted; a partial config
            // is worse than dropping the row.
            if (callResults.some((r) => !r.success || !r.returnData || r.returnData === '0x')) continue
            const [recoverers] = dm.interface.decodeFunctionResult(
              'getModulesPaginated',
              callResults[0].returnData,
            ) as unknown as [string[], string]
            const cooldownSec = BigInt(callResults[1].returnData)
            const expirySec = BigInt(callResults[2].returnData)
            results.push({ delayModifierAddress: addr, recoverers, cooldownSec, expirySec })
          } catch {
            // One bad delay modifier shouldn't fail the rest.
          }
        }
        setAsyncAttempted(true)
        return results
      } catch (e) {
        logError(Errors._812, e instanceof Error ? e.message : String(e))
        setAsyncAttempted(true)
        return []
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, modulesReady, moduleCount, safeAddress, chainId],
    true,
  )

  // Match the spending-limit hook: a safe with zero modules can never have a
  // delay modifier, so mark "done" immediately to unstick the parent's spinner.
  const noModulesEver = modulesReady && (safeInfo?.modules?.length ?? 0) === 0
  const loading = !(noModulesEver || asyncAttempted)

  return { recovery: configs ?? [], loading }
}
