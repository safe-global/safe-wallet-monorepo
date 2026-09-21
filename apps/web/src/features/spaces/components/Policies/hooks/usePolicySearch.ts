import { useMemo } from 'react'
import Fuse from 'fuse.js'
import { getPolicyLabel, getPolicySummary } from '../utils/policyLabel'
import { getPolicyTokens } from '../PoliciesTable/components/PolicyTokens'
import type { Policy } from '../types'

/** Searches the policies held in the browser. The space address book is not searched: a policy carries no names. */

type SearchablePolicy = {
  policy: Policy
  rule: string
  summary: string
  safeAddress: string
  chainId: string
  tokens: string
}

const toSearchable = (policy: Policy): SearchablePolicy => ({
  policy,
  rule: getPolicyLabel(policy),
  summary: getPolicySummary(policy),
  safeAddress: policy.safe.address,
  chainId: policy.safe.chainId,
  tokens: getPolicyTokens(policy)
    .map((token) => token.symbol)
    .join(' '),
})

const usePolicySearch = (policies: Policy[], query: string): Policy[] => {
  const searchable = useMemo(() => policies.map(toSearchable), [policies])

  const fuse = useMemo(
    () =>
      new Fuse(searchable, {
        keys: [{ name: 'rule' }, { name: 'summary' }, { name: 'safeAddress' }, { name: 'tokens' }],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
      }),
    [searchable],
  )

  return useMemo(
    () => (query ? fuse.search(query).map((result) => result.item.policy) : policies),
    [fuse, query, policies],
  )
}

export default usePolicySearch
