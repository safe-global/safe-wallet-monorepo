import { useMemo, useState } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
// eslint-disable-next-line no-restricted-imports -- loadSpendingLimits is excluded from the services barrel to avoid an import cycle via the tx-sender/store graph
import { loadSpendingLimits } from '@/features/spending-limits/services/spendingLimitLoader'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { Errors, logError } from '@/services/exceptions'

const ALLOWANCE_MODULE_VERSIONS = ['0.1.0', '0.1.1'] as const

/**
 * Find the AllowanceModule address actually installed on this Safe — by
 * matching the Safe's modules against every known deployment address across
 * the supported versions and chains.
 */
export const findInstalledAllowanceAddress = (modules: { value: string }[] | null | undefined): string | undefined => {
  if (!modules?.length) return undefined

  const knownAddresses = new Set<string>()
  for (const version of ALLOWANCE_MODULE_VERSIONS) {
    const deployment = getAllowanceModuleDeployment({ version })
    if (!deployment) continue
    for (const addr of Object.values(deployment.networkAddresses)) {
      const list = Array.isArray(addr) ? addr : [addr]
      for (const a of list) knownAddresses.add(a.toLowerCase())
    }
  }

  for (const m of modules) {
    if (knownAddresses.has(m.value.toLowerCase())) return m.value
  }
  return undefined
}

/**
 * Loads the spending limits for a single Safe by reusing the exact same
 * `loadSpendingLimits` service the Safe Settings page uses — only difference
 * is we build a per-chain provider via createWeb3ReadOnly so we can scan
 * multiple safes across chains without flipping the global active-safe state.
 */
export const useSafeSpendingLimits = (chainId: string, safeAddress: string) => {
  const { configs: chains } = useChains()
  const chain = useMemo(() => chains.find((c) => c.chainId === chainId), [chains, chainId])
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const { data: balances } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress, fiatCode: 'USD', trusted: true, excludeSpam: true },
    { skip: !chainId || !safeAddress },
  )

  const tokenInfo = useMemo(() => balances?.items.map((b) => b.tokenInfo) ?? [], [balances?.items])
  const tokenInfoKey = useMemo(() => tokenInfo.map((t) => t.address).join(','), [tokenInfo])
  const moduleCount = safeInfo?.modules?.length ?? 0
  const modulesReady = !!safeInfo && safeInfo.modules !== null

  const moduleAddress = useMemo(() => findInstalledAllowanceAddress(safeInfo?.modules), [safeInfo?.modules])

  const [asyncAttempted, setAsyncAttempted] = useState(false)

  const [limits, error, loading] = useAsync<SpendingLimitState[] | undefined>(
    async () => {
      // Wait for the prerequisites before claiming we attempted the load — we
      // want effectiveLoading to stay true until we have everything to actually
      // call the loader. (asyncAttempted is what flips loading=false.)
      if (!provider || !modulesReady || !safeInfo?.modules || safeInfo.modules.length === 0 || !moduleAddress) {
        return undefined
      }

      try {
        const result = await loadSpendingLimits(provider, safeInfo.modules, safeAddress, chainId, tokenInfo)
        setAsyncAttempted(true)
        return result ?? []
      } catch (e) {
        logError(Errors._609, e instanceof Error ? e.message : String(e))
        setAsyncAttempted(true)
        return []
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, modulesReady, moduleCount, tokenInfoKey, safeAddress, chainId, moduleAddress],
    true,
  )

  // The Settings page's loader doesn't surface raw delegates separately, so we
  // can't render "spender exists, tokens pending" rows from this path. Callers
  // can still detect the module-present-no-limits case via hasAllowanceModule
  // + limits.length === 0.
  const delegates: string[] = []

  // Scan is "done" once we either:
  //  - know the safe has zero modules (nothing to scan), or
  //  - know the safe has modules but none is the AllowanceModule (no policy
  //    to load), or
  //  - actually finished invoking the loader.
  const noModulesEver = modulesReady && (safeInfo?.modules?.length ?? 0) === 0
  const noAllowanceModule = modulesReady && !moduleAddress
  const effectiveLoading = !(noModulesEver || noAllowanceModule || (asyncAttempted && !loading))

  return {
    limits: limits ?? [],
    delegates,
    hasAllowanceModule: !!moduleAddress,
    moduleAddress,
    loading: effectiveLoading,
    error,
  }
}
