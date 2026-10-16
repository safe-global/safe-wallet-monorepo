import { useMemo } from 'react'
import type { Address } from 'viem'
import { PolicyType, accessOf, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NO_SELECTOR } from '../../shared/accessSelector'
import { useActivePolicies } from '../../hooks/useActivePolicies'

/** A native policy on the zero target is the guard's catch-all, set by the fallback flow, not an allowlist entry. */
const isAllowlistEntry = (policy: ActivePolicy): boolean => {
  const access = accessOf(policy)
  if (!access) return false

  return (
    access.operation === 'CALL' &&
    access.selector.toLowerCase() === NO_SELECTOR &&
    access.target.toLowerCase() !== ZERO_ADDRESS.toLowerCase()
  )
}

/**
 * The recipients a Safe already permits native transfers to.
 *
 * The builder needs them because the guard keys native transfers per recipient: re-configuring
 * does not replace the set, so a recipient dropped from the allowlist has to be revoked by address.
 */
export const useNativeAllowlistRecipients = (
  chainId: string,
  safeAddress: string,
): { recipients: Address[]; isLoading: boolean } => {
  const { policies, isLoading } = useActivePolicies(chainId, safeAddress)

  const recipients = useMemo(
    () =>
      policies
        .filter((policy) => policy.type === PolicyType.NativeTransfer && isAllowlistEntry(policy))
        .map((policy) => accessOf(policy)?.target as Address)
        .filter(Boolean),
    [policies],
  )

  return { recipients, isLoading }
}
