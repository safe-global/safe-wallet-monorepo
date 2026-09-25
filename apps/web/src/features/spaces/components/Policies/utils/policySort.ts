import { getPolicyLabel } from './policyLabel'
import { getPolicyStatus, type Policy, type PolicySafe } from '../types'

export const POLICY_SORT_OPTIONS = [
  { value: 'rule', label: 'Rule A–Z' },
  { value: 'appliesTo', label: 'Applies to' },
  { value: 'network', label: 'Network' },
  { value: 'status', label: 'Status' },
] as const

export type PolicySortOption = (typeof POLICY_SORT_OPTIONS)[number]['value']

/** The order used while the user has not picked a sort. */
export const DEFAULT_POLICY_SORT: PolicySortOption = 'status'

/** Names live in the address book and the chain configs, not on the policy. */
export type PolicySortContext = {
  getSafeName: (safe: PolicySafe) => string
  getChainName: (chainId: string) => string
}

// Pending is first because it is the only status where the user has something to do.
const STATUS_ORDER = { pending: 0, unenforced: 1, active: 2 } as const

// A named Safe is listed before an unnamed one, which only has its address to sort by.
const compareSafes = (a: PolicySafe, b: PolicySafe, getSafeName: PolicySortContext['getSafeName']): number => {
  const nameA = getSafeName(a)
  const nameB = getSafeName(b)

  if (nameA && nameB) return nameA.localeCompare(nameB)
  if (nameA || nameB) return nameA ? -1 : 1
  return a.address.toLowerCase().localeCompare(b.address.toLowerCase())
}

const getComparator = (
  sort: PolicySortOption,
  { getSafeName, getChainName }: PolicySortContext,
): ((a: Policy, b: Policy) => number) => {
  switch (sort) {
    case 'rule':
      return (a, b) => getPolicyLabel(a).localeCompare(getPolicyLabel(b))
    case 'appliesTo':
      return (a, b) => compareSafes(a.safe, b.safe, getSafeName)
    case 'network':
      return (a, b) => getChainName(a.safe.chainId).localeCompare(getChainName(b.safe.chainId))
    case 'status':
      return (a, b) => STATUS_ORDER[getPolicyStatus(a)] - STATUS_ORDER[getPolicyStatus(b)]
  }
}

export const sortPolicies = (policies: Policy[], sort: PolicySortOption, context: PolicySortContext): Policy[] =>
  [...policies].sort(getComparator(sort, context))
