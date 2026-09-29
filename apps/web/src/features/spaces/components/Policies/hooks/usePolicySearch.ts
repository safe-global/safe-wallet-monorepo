import { useMemo } from 'react'
import Fuse from 'fuse.js'
import useChains from '@/hooks/useChains'
import { useSafeNameResolver } from '@/hooks/useAllAddressBooks'
import { getPolicyTokens } from '../utils/policyTokens'
import { hasSpendingLimitData, type Policy } from '../types'

/**
 * Searches the policies held in the browser, over what a row shows: names, addresses, network and
 * tokens. The rule is not indexed — the type filter below the search field already selects on it.
 */

type SafeNameResolver = ReturnType<typeof useSafeNameResolver>

type SearchablePolicy = {
  policy: Policy
  names: string
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

/** A proposer's name, as CGW returns it. This is the name the Proposer column shows. */
const getProposerNames = (policy: Policy): string[] => {
  if (policy.type !== 'proposer') return []
  return policy.data.proposers.flatMap((proposer) => proposer.delegatedBy.map((grant) => grant.label))
}

/** Every name a row shows: the Safe's, its spenders' or proposers', and the proposer name from CGW. */
const getSearchableNames = (policy: Policy, resolveName: SafeNameResolver): string[] => {
  const { chainId } = policy.safe

  return [
    resolveName(policy.safe.address, chainId),
    ...getParties(policy).map((party) => resolveName(party, chainId)),
    ...getProposerNames(policy),
  ]
}

const toSearchable = (
  policy: Policy,
  chainNames: Map<string, string>,
  resolveName: SafeNameResolver,
): SearchablePolicy => ({
  policy,
  names: getSearchableNames(policy, resolveName).filter(Boolean).join(' '),
  safeAddress: policy.safe.address,
  parties: getParties(policy).join(' '),
  network: [chainNames.get(policy.safe.chainId), policy.safe.chainId].filter(Boolean).join(' '),
  tokens: getPolicyTokens(policy)
    .map((token) => token.symbol)
    .join(' '),
})

const usePolicySearch = (policies: Policy[], query: string): Policy[] => {
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
