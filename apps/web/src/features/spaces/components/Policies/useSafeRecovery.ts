import { useMemo, useState } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getRecoveryDelayModifiers } from '@/features/recovery/services/delay-modifier'
import { multicall } from '@safe-global/utils/utils/multicall'
import { SENTINEL_ADDRESS } from '@safe-global/utils/utils/constants'
import useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'

export type SafeRecoveryConfig = {
  delayModifierAddress: string
  recoverers: string[]
  cooldownSec: bigint
  expirySec: bigint // 0 = never expires
}

/**
 * Resolves the Account Recovery (Zodiac Delay Modifier) configuration for one Safe.
 *
 *  1. Look up the chain config + a per-chain JSON-RPC provider.
 *  2. Fetch the Safe's modules from CGW.
 *  3. Walk the modules via `getRecoveryDelayModifiers`, which probes each module's
 *     bytecode through the proxy chain to confirm it's an official Zodiac Delay.
 *  4. For each delay modifier, multicall `getModulesPaginated` (recoverers),
 *     `txCooldown`, and `txExpiration` to get the live config.
 *
 * Returns `[]` for any Safe that doesn't have a Delay Modifier attached.
 */
export const useSafeRecovery = (chainId: string, safeAddress: string) => {
  const { configs: chains } = useChains()
  const chain = useMemo(() => chains.find((c) => c.chainId === chainId), [chains, chainId])
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const moduleCount = safeInfo?.modules?.length ?? 0
  const modulesReady = !!safeInfo && safeInfo.modules !== null

  // See useSafeSpendingLimits — track whether the async callback has actually fired so we
  // don't report "scan complete" on the initial render before useAsync's useEffect runs.
  const [asyncAttempted, setAsyncAttempted] = useState(false)

  const [configs, error, loading] = useAsync<SafeRecoveryConfig[] | undefined>(
    async () => {
      try {
        if (!provider || !modulesReady || !safeInfo?.modules || safeInfo.modules.length === 0) return

        const delayModifiers = await getRecoveryDelayModifiers(chainId, safeInfo.modules, provider)
        if (delayModifiers.length === 0) return []

        const results: SafeRecoveryConfig[] = []
        for (const dm of delayModifiers) {
          const addr = await dm.getAddress()
          const calls = [
            {
              to: addr,
              data: dm.interface.encodeFunctionData('getModulesPaginated', [SENTINEL_ADDRESS, 100]),
            },
            { to: addr, data: dm.interface.encodeFunctionData('txCooldown') },
            { to: addr, data: dm.interface.encodeFunctionData('txExpiration') },
          ]
          const callResults = await multicall(provider, calls)

          const [recoverers] = dm.interface.decodeFunctionResult(
            'getModulesPaginated',
            callResults[0].returnData,
          ) as unknown as [string[], string]
          const cooldownSec = BigInt(callResults[1].returnData)
          const expirySec = BigInt(callResults[2].returnData)

          results.push({ delayModifierAddress: addr, recoverers, cooldownSec, expirySec })
        }
        return results
      } finally {
        setAsyncAttempted(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, modulesReady, moduleCount, safeAddress, chainId],
    true,
  )

  const noModulesEver = modulesReady && (safeInfo?.modules?.length ?? 0) === 0
  const effectiveLoading = !(noModulesEver || (asyncAttempted && !loading))

  return { recovery: configs ?? [], loading: effectiveLoading, error }
}
