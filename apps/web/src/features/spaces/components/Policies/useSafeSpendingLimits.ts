import { useMemo, useState } from 'react'
import { AllowanceModule__factory } from '@safe-global/utils/types/contracts'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { getTokensForDelegates } from '@/features/spending-limits/services/spendingLimitLoader'
import type { SpendingLimitState } from '@/features/spending-limits/types'
import useChains from '@/hooks/useChains'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'

const ALLOWANCE_MODULE_VERSIONS = ['0.1.0', '0.1.1'] as const

/**
 * Find the AllowanceModule address that the Safe actually has installed by checking each
 * of the Safe's modules against every known AllowanceModule deployment address across all
 * versions and chains. This avoids the "derive an address from the chain ID" trap, which
 * fails for v0.1.1 on mainnet because the deployment JSON has no `networkAddresses["1"]`.
 *
 * Returns the exact address from the Safe's modules array — which is guaranteed to have
 * bytecode (the Safe couldn't have enabled it otherwise).
 */
export const findInstalledAllowanceAddress = (modules: { value: string }[] | null | undefined): string | undefined => {
  if (!modules?.length) return undefined

  const knownAddresses = new Set<string>()
  for (const version of ALLOWANCE_MODULE_VERSIONS) {
    const deployment = getAllowanceModuleDeployment({ version })
    if (!deployment) continue
    for (const addr of Object.values(deployment.networkAddresses)) {
      // networkAddresses values can be either a single address string or an array per network.
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
 * Loads the spending limits for a single Safe by:
 *   1. resolving the chain config + a read-only JSON-RPC provider,
 *   2. fetching the Safe's modules (via the CGW Safe info endpoint),
 *   3. fetching the Safe's balances to enrich token info,
 *   4. calling the AllowanceModule per-delegate to collect every (beneficiary, token) tuple.
 *
 * Returns `[]` when the Safe has no AllowanceModule attached.
 */
export const useSafeSpendingLimits = (chainId: string, safeAddress: string) => {
  const { configs: chains } = useChains()
  const chain = useMemo(() => chains.find((c) => c.chainId === chainId), [chains, chainId])

  // Create a per-chain provider — useWeb3ReadOnly() only gives us the currently-selected chain's
  // provider, which is wrong when we're iterating across multiple Safes on different chains.
  const provider = useMemo(() => (chain ? createWeb3ReadOnly(chain) : undefined), [chain])

  const { data: safeInfo } = useSafesGetSafeV1Query({ chainId, safeAddress }, { skip: !chainId || !safeAddress })

  const { data: balances } = useBalancesGetBalancesV1Query(
    { chainId, safeAddress, fiatCode: 'USD', trusted: true, excludeSpam: true },
    { skip: !chainId || !safeAddress },
  )

  const tokenInfo = useMemo(() => balances?.items.map((b) => b.tokenInfo) ?? [], [balances?.items])

  // A stable dep key so we don't refetch on every balance poll just because the array ref changed.
  const tokenInfoKey = useMemo(() => tokenInfo.map((t) => t.address).join(','), [tokenInfo])
  const moduleCount = safeInfo?.modules?.length ?? 0
  const modulesReady = !!safeInfo && safeInfo.modules !== null

  // Tracks whether the async callback has fired at least once. Without this, the parent
  // would receive a premature `loading: false` on the first render — before useAsync's
  // useEffect has had a chance to set loading=true — and conclude the scan was done.
  const [asyncAttempted, setAsyncAttempted] = useState(false)

  const [limits, error, loading] = useAsync<SpendingLimitState[] | undefined>(
    async () => {
      try {
        if (!provider || !modulesReady || !safeInfo?.modules || safeInfo.modules.length === 0) return

        // Use the EXACT address the Safe has installed — not one derived from the deployment
        // JSON. Deriving via `networkAddresses[chainId]` fails for v0.1.1 on mainnet (no entry),
        // and even the CREATE2 fallback can resolve to an address with no bytecode on the
        // current chain. The Safe's own module address is the one we know has bytecode (Safe
        // would have refused `enableModule` otherwise).
        const moduleAddress = findInstalledAllowanceAddress(safeInfo.modules)
        if (!moduleAddress) return

        const contract = AllowanceModule__factory.connect(moduleAddress, provider)
        const { results: delegates } = await contract.getDelegates(safeAddress, 0, 100)
        if (delegates.length === 0) return []

        const spendingLimits = await getTokensForDelegates(contract, provider, safeAddress, delegates, tokenInfo)
        // Mirror the upstream loader's filter: drop "zero allowance, one-time" stubs.
        return spendingLimits.filter((sl) => !(sl.amount === '0' && sl.resetTimeMin === '0'))
      } finally {
        setAsyncAttempted(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, modulesReady, moduleCount, tokenInfoKey, safeAddress, chainId],
    true,
  )

  // A Safe with zero modules can never have a spending limit; declare done without waiting for async.
  const noModulesEver = modulesReady && (safeInfo?.modules?.length ?? 0) === 0
  const effectiveLoading = !(noModulesEver || (asyncAttempted && !loading))

  // Whether the Safe has the canonical AllowanceModule attached — independent of whether the
  // multicall actually surfaced any delegates. Useful for rendering a row even when the loader
  // returns empty / errors, so the user can see "policy deployed but no limits".
  const hasAllowanceModule = useMemo(() => !!findInstalledAllowanceAddress(safeInfo?.modules), [safeInfo?.modules])

  return { limits: limits ?? [], loading: effectiveLoading, error, hasAllowanceModule }
}
