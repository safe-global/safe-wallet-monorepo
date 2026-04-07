/**
 * Lightweight spending limit deployment utilities.
 *
 * This file only imports from @safe-global/safe-modules-deployments (lightweight).
 * Use this for address checking in utility files that are loaded everywhere.
 * Use spendingLimitContracts.ts for actual contract interactions (lazy-loaded features).
 */
import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

enum ALLOWANCE_MODULE_VERSIONS {
  '0.1.0' = '0.1.0',
  '0.1.1' = '0.1.1',
}

const ALL_VERSIONS = [ALLOWANCE_MODULE_VERSIONS['0.1.0'], ALLOWANCE_MODULE_VERSIONS['0.1.1']]

const getModuleAddress = (deployment: ReturnType<typeof getAllowanceModuleDeployment>, chainId: string) => {
  if (!deployment) return undefined
  // Fall back to first known address for unregistered chains (deterministic via CREATE2)
  return deployment.networkAddresses[chainId] ?? Object.values(deployment.networkAddresses)[0]
}

export const getDeployment = (chainId: string, modules: SafeState['modules']) => {
  if (!modules?.length) return
  for (const version of ALL_VERSIONS) {
    const deployment = getAllowanceModuleDeployment({ version })
    if (!deployment) continue
    const deploymentAddress = getModuleAddress(deployment, chainId)
    const isMatch = modules?.some((address) => sameAddress(address.value, deploymentAddress))
    if (isMatch) return deployment
  }
}

export const getLatestSpendingLimitAddress = (chainId: string): string | undefined => {
  // Try versions from newest to oldest, picking the first that's registered on this chain.
  // Unlike getDeployment (which uses CREATE2 fallback for already-enabled modules),
  // new enablements must match an explicitly registered chain to avoid enabling
  // a version that was never deployed there.
  for (let i = ALL_VERSIONS.length - 1; i >= 0; i--) {
    const deployment = getAllowanceModuleDeployment({ version: ALL_VERSIONS[i] })
    if (!deployment) continue
    if (deployment.networkAddresses[chainId]) return deployment.networkAddresses[chainId]
  }
}

export const getDeployedSpendingLimitModuleAddress = (
  chainId: string,
  modules: SafeState['modules'],
): string | undefined => {
  const deployment = getDeployment(chainId, modules)
  return getModuleAddress(deployment, chainId)
}
