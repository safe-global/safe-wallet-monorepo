import { useMemo } from 'react'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import type { PolicyTokenInfo } from '@safe-global/views/features/spaces/components/Policies/types'
import { useSpacePolicies } from '../../hooks/useSpacePolicies'
import { getSpendingLimitTokens } from '../utils/spendingLimitTokens'

export type SpendingLimitTokensResult = {
  tokens: PolicyTokenInfo[]
  /** Until the Space's policies load, `tokens` is empty without meaning the Safe has no spending limit. */
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

/** The tokens of the spending limits, active or queued, of the Safe picked in the flow. */
export const useSpendingLimitTokens = (): SpendingLimitTokensResult => {
  const { policies, isLoading, isError, refetch } = useSpacePolicies()
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const safeAddress = scope?.safeAddress

  const tokens = useMemo(
    () => (chainId && safeAddress ? getSpendingLimitTokens(policies, { chainId, address: safeAddress }) : []),
    [policies, chainId, safeAddress],
  )

  return { tokens, isLoading, isError, refetch }
}
