import { useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { AllowlistRule } from '../types'
import { useSpacePolicies } from '../../hooks/useSpacePolicies'
import { getSpendingLimitImpacts, type SpendingLimitImpact } from '../utils/spendingLimitImpacts'

export type SpendingLimitImpactsResult = {
  impacts: SpendingLimitImpact[]
  /** Until the Space's policies load, `impacts` is empty without meaning the Safe has no spending limit. */
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** How the allowlist would change the spending limits of the Safe picked in the flow. */
export const useSpendingLimitImpacts = (rules: readonly AllowlistRule[]): SpendingLimitImpactsResult => {
  const { policies, isLoading, isError, refetch } = useSpacePolicies()
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  const impacts = useMemo(
    () => (chainId && safeAddress ? getSpendingLimitImpacts(policies, { chainId, address: safeAddress }, rules) : []),
    [policies, chainId, safeAddress, rules],
  )

  return { impacts, isLoading, isError, refetch }
}
