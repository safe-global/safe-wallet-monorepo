import { useMemo } from 'react'
import Fuse from 'fuse.js'
import useChains from '@/hooks/useChains'
import { getPolicyLabel, getPolicySummary } from '../utils/policyLabel'
import { getPolicyTokens } from '../utils/policyTokens'
import { hasSpendingLimitData, type Policy } from '../types'

/** Searches the policies held in the browser. The space address book is not searched: a policy carries no names. */

type SearchablePolicy = {
  policy: Policy
  rule: string
  summary: string
  safeAddress: string
  /** The spenders or proposers a policy grants something to. */
  parties: string
  network: string
  tokens: string
}

const getParties = (policy: Policy): string[] => {
  if (hasSpendingLimitData(policy)) return policy.data.spenders.map((spender) => spender.spender)
  if (policy.type === 'proposer') return policy.data.proposers.map((proposer) => proposer.proposer)
  return []
}

const toSearchable = (policy: Policy, chainNames: Map<string, string>): SearchablePolicy => ({
  policy,
  rule: getPolicyLabel(policy),
  summary: getPolicySummary(policy),
  safeAddress: policy.safe.address,
  parties: getParties(policy).join(' '),
  network: [chainNames.get(policy.safe.chainId), policy.safe.chainId].filter(Boolean).join(' '),
  tokens: getPolicyTokens(policy)
    .map((token) => token.symbol)
    .join(' '),
})

const usePolicySearch = (policies: Policy[], query: string): Policy[] => {
  const { configs } = useChains()

  const chainNames = useMemo(() => new Map(configs.map((chain) => [chain.chainId, chain.chainName])), [configs])
  const searchable = useMemo(() => policies.map((policy) => toSearchable(policy, chainNames)), [policies, chainNames])

  const fuse = useMemo(
    () =>
      new Fuse(searchable, {
        keys: [
          { name: 'rule' },
          { name: 'summary' },
          { name: 'safeAddress' },
          { name: 'parties' },
          { name: 'network' },
          { name: 'tokens' },
        ],
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
