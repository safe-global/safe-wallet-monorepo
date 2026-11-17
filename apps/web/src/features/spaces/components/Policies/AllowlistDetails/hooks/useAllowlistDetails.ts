import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useGetSafeOverviewQuery } from '@/store/api/gateway'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { usePolicyDetailsBase, type PolicyDetailsBase } from '../../hooks/usePolicyDetailsBase'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import {
  getPolicyStatus,
  isSpendingLimitPolicy,
  type Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { ActiveAllowlistPolicy } from '../../AllowlistDrawer/resolveState'

const ENFORCED_BY = 'Safe policy contract'

export type AllowlistDetailsContent = PolicyDetailsBase & {
  overview: { enforcedBy: string }
  /** Counted per spender and token. */
  uncoveredSpendingLimitCount?: number
  /** Only read while a delayed change waits to be applied, whose banner names them. */
  signatures?: { threshold: number; owners: number }
}

export const useAllowlistDetails = (policy: ActiveAllowlistPolicy, policies: Policy[]): AllowlistDetailsContent => {
  const { chainId, address: safeAddress } = policy.safe
  const recipients = useMemo(() => getAllowlistRecipients(policy.data), [policy.data])
  const base = usePolicyDetailsBase(policy.safe, recipients)

  const uncoveredSpendingLimitCount = useMemo(() => {
    if (policy.spendingLimitsCovered) return undefined

    let count = 0
    for (const other of policies) {
      if (!isSpendingLimitPolicy(other) || getPolicyStatus(other) !== 'active') continue
      if (other.safe.chainId !== chainId || !sameAddress(other.safe.address, safeAddress)) continue
      count += other.data.spenders.reduce(
        (sum, { isActive, allowances }) => (isActive === false ? sum : sum + allowances.length),
        0,
      )
    }
    return count
  }, [policy.spendingLimitsCovered, policies, chainId, safeAddress])

  const { currentData: safeOverview } = useGetSafeOverviewQuery(
    policy.scheduledChange ? { chainId, safeAddress } : skipToken,
  )
  const signatures = safeOverview
    ? { threshold: safeOverview.threshold, owners: safeOverview.owners.length }
    : undefined

  return {
    ...base,
    overview: { enforcedBy: ENFORCED_BY },
    uncoveredSpendingLimitCount,
    signatures,
  }
}
