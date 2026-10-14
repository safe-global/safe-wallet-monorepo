import { useMemo } from 'react'
import type { Enforcement, PolicyType } from '@safe-global/store/gateway/policies/types'
import { useActivePolicies } from '../hooks/useActivePolicies'
import { useAvailablePolicies } from '../hooks/useAvailablePolicies'

const policyContractOf = (enforcement: Enforcement | null | undefined): string | undefined =>
  enforcement?.via === 'guard' ? enforcement.guards.transactionGuard?.policyContract : undefined

/**
 * Maps a policy contract address to the policy type it implements, so a decoded
 * `Configuration` can be labelled and its payload decoded as that policy defines it.
 *
 * Both sources are space-scoped and skip outside a space, in which case the map is empty and
 * callers fall back to decoding the payload by shape.
 */
export const usePolicyTypeByContract = (chainId: string, safeAddress: string): Map<string, PolicyType> => {
  const { policies: catalogue } = useAvailablePolicies(chainId, safeAddress)
  const { policies: active } = useActivePolicies(chainId, safeAddress)

  return useMemo(() => {
    const byContract = new Map<string, PolicyType>()

    for (const entry of catalogue) {
      const contract = policyContractOf(entry.enforcement)
      if (contract) byContract.set(contract.toLowerCase(), entry.type)
    }

    // Active policies win: they describe what is actually installed on this Safe.
    for (const policy of active) {
      const contract = policyContractOf(policy.enforcement)
      if (contract) byContract.set(contract.toLowerCase(), policy.type)
    }

    return byContract
  }, [catalogue, active])
}
