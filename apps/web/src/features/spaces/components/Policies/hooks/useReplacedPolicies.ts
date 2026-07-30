import { useMemo } from 'react'
import type { ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { accessId, type Access } from '../shared/accessSelector'
import type { PolicyConfiguration } from '../shared/guardTx'
import { useActivePolicies } from './useActivePolicies'

/**
 * The active policies a new configuration would overwrite.
 *
 * The guard stores one policy per access, so configuring an access a policy already
 * occupies replaces it silently on-chain. Every builder should surface that before the
 * user signs — hence one hook rather than per-flow logic.
 */
export const useReplacedPolicies = (
  chainId: string,
  safeAddress: string,
  configurations: PolicyConfiguration[],
): ActivePolicy[] => {
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    if (configurations.length === 0 || active.length === 0) return []

    const targetIds = new Set(configurations.map((configuration) => accessId(configuration as Access)))

    return active.filter((policy) => targetIds.has(policy.id.toLowerCase()))
  }, [active, configurations])
}
