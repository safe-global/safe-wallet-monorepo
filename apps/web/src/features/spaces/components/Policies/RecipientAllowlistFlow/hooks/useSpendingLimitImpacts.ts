import { useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { AllowlistRule } from '../types'
import { useSpacePolicies } from '../../hooks/useSpacePolicies'
import { getSpendingLimitImpacts, type SpendingLimitImpact } from '../utils/spendingLimitImpacts'

/** How the allowlist would change the spending limits of the Safe picked in the flow. */
export const useSpendingLimitImpacts = (rules: readonly AllowlistRule[]): SpendingLimitImpact[] => {
  const { policies } = useSpacePolicies()
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  return useMemo(
    () => (chainId && safeAddress ? getSpendingLimitImpacts(policies, { chainId, address: safeAddress }, rules) : []),
    [policies, chainId, safeAddress, rules],
  )
}
