import { useMemo } from 'react'
import Fuse from 'fuse.js'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { getPolicyTokens } from '../utils/policyTokens'
import { isSpendingLimitPolicy, type Policy } from '../types'

/**
 * Searches the policies held in the browser, over what a row shows: names, addresses, network and
 * tokens. The rule is not indexed — the type filter below the search field already selects on it.
 * Spender names are indexed although the table hides them, so a hit on one is reported back and
 * the row can say why it matched.
 */

type SafeNameResolver = ReturnType<typeof useSafeNameResolver>

type SearchablePolicy = {
  policy: Policy
  names: string
  /** Kept apart from `names` so a hit can be traced back to the spender. */
  spenderNames: string[]
  safeAddress: string
  /** The spenders or proposers a policy grants something to. */
  parties: string
  network: string
  tokens: string
}

export type PolicySearchResult = {
  policies: Policy[]
  /** Policy id → the spender name the query hit. */
  matchedSpenderNames: Map<string, string>
}

const getSpenders = (policy: Policy): string[] =>
  isSpendingLimitPolicy(policy) ? policy.data.spenders.map((spender) => spender.spender) : []

const getProposers = (policy: Policy): string[] =>
  policy.type === 'proposer' ? policy.data.proposers.map((proposer) => proposer.proposer) : []

/** A proposer's name, as CGW returns it. This is the name the Proposer column shows. */
const getProposerLabels = (policy: Policy): string[] => {
  if (policy.type !== 'proposer') return []
  return policy.data.proposers.flatMap((proposer) => proposer.delegatedBy.map((grant) => grant.label))
}

/** Every name a row shows: the Safe's, its proposers', and the proposer label from CGW. */
const getSearchableNames = (policy: Policy, resolveName: SafeNameResolver): string[] => {
  const { chainId } = policy.safe

  return [
    resolveName(policy.safe.address, chainId),
    ...getProposers(policy).map((proposer) => resolveName(proposer, chainId)),
    ...getProposerLabels(policy),
  ]
}

const toSearchable = (
  policy: Policy,
  chainNames: Map<string, string>,
  resolveName: SafeNameResolver,
): SearchablePolicy => ({
  policy,
  names: getSearchableNames(policy, resolveName).filter(Boolean).join(' '),
  spenderNames: getSpenders(policy)
    .map((spender) => resolveName(spender, policy.safe.chainId))
    .filter(Boolean),
  safeAddress: policy.safe.address,
  parties: [...getSpenders(policy), ...getProposers(policy)].join(' '),
  network: [chainNames.get(policy.safe.chainId), policy.safe.chainId].filter(Boolean).join(' '),
  tokens: getPolicyTokens(policy)
    .map((token) => token.symbol)
    .join(' '),
})

const usePolicySearch = (policies: Policy[], query: string): PolicySearchResult => {
  const { configs } = useChains()
  const resolveName = useSafeNameResolver()

  const chainNames = useMemo(() => new Map(configs.map((chain) => [chain.chainId, chain.chainName])), [configs])
  const searchable = useMemo(
    () => policies.map((policy) => toSearchable(policy, chainNames, resolveName)),
    [policies, chainNames, resolveName],
  )

  const fuse = useMemo(
    () =>
      new Fuse(searchable, {
        keys: [
          { name: 'names' },
          { name: 'spenderNames' },
          { name: 'safeAddress' },
          { name: 'parties' },
          { name: 'network' },
          { name: 'tokens' },
        ],
        threshold: 0.2,
        findAllMatches: true,
        ignoreLocation: true,
        includeMatches: true,
      }),
    [searchable],
  )

  return useMemo(() => {
    if (!query) return { policies, matchedSpenderNames: new Map() }

    const results = fuse.search(query)
    const matchedSpenderNames = new Map<string, string>()

    for (const { item, matches } of results) {
      const spenderName = matches?.find((match) => match.key === 'spenderNames')?.value
      if (spenderName) matchedSpenderNames.set(item.policy.id, spenderName)
    }

    return { policies: results.map((result) => result.item.policy), matchedSpenderNames }
  }, [fuse, query, policies])
}

export default usePolicySearch
